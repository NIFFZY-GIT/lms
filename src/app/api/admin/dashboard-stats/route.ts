import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';

export async function GET() {
  try {
    await getServerUser(Role.ADMIN);

    // Run multiple queries in parallel for efficiency
    const [studentCountResult, courseCountResult, pendingPaymentsResult, recentPaymentsResult] = await Promise.all([
      db.query("SELECT COUNT(*) FROM \"User\" WHERE role = 'STUDENT'"),
      db.query("SELECT COUNT(*) FROM \"Course\""),
      db.query("SELECT COUNT(*) FROM \"Payment\" WHERE status = 'PENDING'"),
      db.query(`
        SELECT p."createdAt", u.name as "studentName", c.title as "courseTitle"
        FROM "Payment" p
        JOIN "User" u ON p."studentId" = u.id
        JOIN "Course" c ON p."courseId" = c.id
        ORDER BY p."createdAt" DESC
        LIMIT 5;
      `)
    ]);

    const stats = {
      totalStudents: parseInt(studentCountResult.rows[0].count, 10),
      totalCourses: parseInt(courseCountResult.rows[0].count, 10),
      pendingPayments: parseInt(pendingPaymentsResult.rows[0].count, 10),
      recentPayments: recentPaymentsResult.rows,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Fetch dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}