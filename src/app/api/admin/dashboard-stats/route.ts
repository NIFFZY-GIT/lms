import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';
import {
  currentMonth,
  formatMonthLabel,
  getCourseRevenue,
  getPaidStudents,
  getRevenueSummary,
} from '../../../../lib/revenue';

export async function GET() {
  try {
    await getServerUser(Role.ADMIN);

    const month = currentMonth();

    // Run multiple queries in parallel for efficiency
    const [
      studentCountResult,
      instructorCountResult,
      courseCountResult,
      pendingPaymentsResult,
      recentCoursesResult,
      recentUsersResult,
      enrollmentsTrendResult,
      monthSummary,
      monthPaidStudents,
      courseRevenue,
    ] = await Promise.all([
      db.query("SELECT COUNT(*) FROM \"User\" WHERE role = 'STUDENT'"),
      db.query("SELECT COUNT(*) FROM \"User\" WHERE role = 'INSTRUCTOR'"),
      db.query("SELECT COUNT(*) FROM \"Course\""),
      db.query("SELECT COUNT(*) FROM \"Payment\" WHERE status = 'PENDING'"),
      db.query(`
        SELECT id, title, "createdAt" FROM "Course" ORDER BY "createdAt" DESC LIMIT 5;
      `),
      db.query(`
        SELECT id, name, role, "createdAt" FROM "User" ORDER BY "createdAt" DESC LIMIT 5;
      `),
      db.query(`
        SELECT to_char(d::date, 'YYYY-MM-DD') AS day,
               COUNT(p.*) FILTER (WHERE p.status='APPROVED') AS count
        FROM generate_series((CURRENT_DATE - interval '6 days'), CURRENT_DATE, interval '1 day') d
        LEFT JOIN "Payment" p ON date(p."createdAt") = d::date
        GROUP BY day
        ORDER BY day;
      `),
      getRevenueSummary(month),
      getPaidStudents({ month, limit: 25 }),
      getCourseRevenue(month),
    ]);

    const stats = {
      totalStudents: parseInt(studentCountResult.rows[0].count, 10),
      totalInstructors: parseInt(instructorCountResult.rows[0].count, 10),
      totalCourses: parseInt(courseCountResult.rows[0].count, 10),
      pendingPayments: parseInt(pendingPaymentsResult.rows[0].count, 10),
      // All-time approved revenue (kept for the "Total Revenue" card)
      revenue: monthSummary.totalRevenue,
      totalPaidStudents: monthSummary.totalPaidStudents,
      // Current month
      month,
      monthLabel: formatMonthLabel(month),
      monthRevenue: monthSummary.periodRevenue,
      monthPaidStudentsCount: monthSummary.periodPaidStudents,
      monthApprovedPayments: monthSummary.periodPayments,
      monthPaidStudents,
      // Per-course paid students + revenue for the current month
      courseRevenue,
      recentCourses: recentCoursesResult.rows,
      recentUsers: recentUsersResult.rows,
      enrollmentsTrend: enrollmentsTrendResult.rows, // [{day, count}]
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Fetch dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
