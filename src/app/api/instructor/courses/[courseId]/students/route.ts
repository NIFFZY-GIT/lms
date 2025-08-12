import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role } from '@/types';

// GET: list approved enrolled students for a course (instructor must own or admin)
export async function GET(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const user = await getServerUser([Role.ADMIN, Role.INSTRUCTOR]);
    const { courseId } = await params;

    if (user.role === Role.INSTRUCTOR) {
      const ownership = await db.query('SELECT "createdById" FROM "Course" WHERE id = $1', [courseId]);
      if (ownership.rows.length === 0) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      if (ownership.rows[0].createdById !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sql = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        p.status, 
        p."createdAt" AS "enrolledAt",
        COALESCE(stats.attempts, 0) AS attempts,
        COALESCE(stats.highest_score, 0) AS "highestScore",
        COALESCE(stats.avg_score, 0) AS "averageScore"
      FROM "Payment" p
      JOIN "User" u ON u.id = p."studentId"
      LEFT JOIN (
        SELECT qa."studentId", COUNT(*) AS attempts,
               MAX(qa.score) AS highest_score,
               AVG(qa.score) AS avg_score
        FROM "QuizAttempt" qa
        JOIN "Quiz" q ON qa."quizId" = q.id
        WHERE q."courseId" = $1
        GROUP BY qa."studentId"
      ) stats ON stats."studentId" = u.id
      WHERE p."courseId" = $1 AND p.status = 'APPROVED'
      ORDER BY p."createdAt" DESC;`;
    const result = await db.query(sql, [courseId]);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Fetch enrolled students error:', error);
    return NextResponse.json({ error: 'Failed to fetch enrolled students' }, { status: 500 });
  }
}
