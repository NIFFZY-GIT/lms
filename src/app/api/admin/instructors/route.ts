import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role } from '@/types';

export async function GET() {
  try {
    await getServerUser(Role.ADMIN);

    const sql = `
      SELECT u.id,
             u.name,
             u.email,
             u."createdAt",
             COALESCE(c.count, 0)::int AS "courseCount",
             COALESCE(c.titles, ARRAY[]::text[]) AS "courseTitles"
      FROM "User" u
      LEFT JOIN (
        SELECT "createdById",
               COUNT(*) AS count,
               array_agg(title ORDER BY "createdAt" DESC) AS titles
        FROM "Course"
        GROUP BY "createdById"
      ) c ON c."createdById" = u.id
      WHERE u.role = 'INSTRUCTOR'
      ORDER BY u."createdAt" DESC;
    `;
    const result = await db.query(sql);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Fetch instructors error:', error);
    return NextResponse.json({ error: 'Failed to fetch instructors' }, { status: 500 });
  }
}
