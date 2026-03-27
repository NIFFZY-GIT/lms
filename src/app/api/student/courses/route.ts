import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';

export async function GET() {
  try {
    const user = await getServerUser([Role.STUDENT, Role.ADMIN]);

    // For ONE_TIME_PURCHASE courses: join where status = 'APPROVED'
    // For SUBSCRIPTION courses: join where status = 'APPROVED' AND subscriptionExpiryDate > NOW
    const sql = `
      SELECT c.*
      FROM "Payment" p
      JOIN "Course" c ON p."courseId" = c.id
      WHERE p."studentId" = $1 AND p.status = 'APPROVED'
      AND (
        c."courseType" = 'ONE_TIME_PURCHASE' 
        OR (c."courseType" = 'SUBSCRIPTION' AND p."subscriptionExpiryDate" > CURRENT_TIMESTAMP)
      )
      ORDER BY p."createdAt" DESC;
    `;

    const result = await db.query(sql, [user.id]);
    const courses = result.rows.map((course) => ({
      ...course,
      price: parseFloat(course.price),
    }));

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Fetch student enrolled courses error:', error);
    return NextResponse.json({ error: 'Failed to fetch enrolled courses' }, { status: 500 });
  }
}
