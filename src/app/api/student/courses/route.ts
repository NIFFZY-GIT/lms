import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';

export async function GET() {
  try {
    const user = await getServerUser(Role.STUDENT);

    const sql = `
      SELECT c.*
      FROM "Payment" p
      JOIN "Course" c ON p."courseId" = c.id
      WHERE p."studentId" = $1 AND p.status = 'APPROVED'
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
