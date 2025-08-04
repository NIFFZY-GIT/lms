import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';

export async function GET() {
  try {
    const user = await getServerUser(Role.STUDENT);

    // This query joins attempts with quizzes and courses to get all necessary info
    const sql = `
      SELECT 
        qa.id AS "attemptId",
        qa.score,
        qa."createdAt" AS "attemptedAt",
        q.title AS "quizTitle",
        c.title AS "courseTitle",
        c.id AS "courseId"
      FROM 
        "QuizAttempt" qa
      JOIN "Quiz" q ON qa."quizId" = q.id
      JOIN "Course" c ON q."courseId" = c.id
      WHERE 
        qa."studentId" = $1
      ORDER BY 
        qa."createdAt" DESC;
    `;

    const result = await db.query(sql, [user.id]);

    // Format the data before sending, ensuring score is a number
    const attempts = result.rows.map(row => ({
      ...row,
      score: parseFloat(row.score),
    }));

    return NextResponse.json(attempts);
  } catch (error) {
    console.error("Fetch student quiz attempts error:", error);
    return NextResponse.json({ error: "Failed to fetch quiz attempts" }, { status: 500 });
  }
}