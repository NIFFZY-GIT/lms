import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';

export async function GET() {
  try {
    await getServerUser(Role.ADMIN);

    // Run multiple queries in parallel for efficiency
    const [studentCountResult, instructorCountResult, courseCountResult, pendingPaymentsResult, revenueResult, recentPaymentsResult, recentCoursesResult, recentUsersResult, enrollmentsTrendResult] = await Promise.all([
      db.query("SELECT COUNT(*) FROM \"User\" WHERE role = 'STUDENT'"),
      db.query("SELECT COUNT(*) FROM \"User\" WHERE role = 'INSTRUCTOR'"),
      db.query("SELECT COUNT(*) FROM \"Course\""),
      db.query("SELECT COUNT(*) FROM \"Payment\" WHERE status = 'PENDING'"),
      db.query("SELECT COALESCE(SUM(c.price),0) AS revenue FROM \"Payment\" p JOIN \"Course\" c ON p.\"courseId\" = c.id WHERE p.status='APPROVED'"),
      db.query(`
        SELECT p."createdAt", u.name as "studentName", c.title as "courseTitle"
        FROM "Payment" p
        JOIN "User" u ON p."studentId" = u.id
        JOIN "Course" c ON p."courseId" = c.id
        WHERE p.status='APPROVED'
        ORDER BY p."createdAt" DESC
        LIMIT 5;
      `),
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
      `)
    ]);

    const stats = {
      totalStudents: parseInt(studentCountResult.rows[0].count, 10),
      totalInstructors: parseInt(instructorCountResult.rows[0].count, 10),
      totalCourses: parseInt(courseCountResult.rows[0].count, 10),
      pendingPayments: parseInt(pendingPaymentsResult.rows[0].count, 10),
      revenue: parseFloat(revenueResult.rows[0].revenue),
      recentPayments: recentPaymentsResult.rows,
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