import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';

export async function GET() {
  try {
    await getServerUser(Role.ADMIN);

    // This complex SQL query does the following:
    // 1. Joins attempts with users, quizzes, and courses.
    // 2. Groups by student and course.
    // 3. Calculates the total number of quizzes in each course.
    // 4. Calculates how many the student got correct.
    // 5. Calculates the final score as a percentage.
    const sql = `
      SELECT
        u.id AS "studentId",
        u.name AS "studentName",
        c.id AS "courseId",
        c.title AS "courseTitle",
        COUNT(q.id) AS "totalQuizzes",
        SUM(CASE WHEN qa. "isCorrect" = TRUE THEN 1 ELSE 0 END) AS "correctAnswers",
        (SUM(CASE WHEN qa. "isCorrect" = TRUE THEN 1 ELSE 0 END) * 100.0 / COUNT(q.id)) AS "score"
      FROM
        "QuizAttempt" qa
      JOIN "User" u ON qa."studentId" = u.id
      JOIN "Quiz" q ON qa."quizId" = q.id
      JOIN "Course" c ON q."courseId" = c.id
      GROUP BY
        u.id, u.name, c.id, c.title
      ORDER BY
        "courseTitle", "score" DESC;
    `;
    
    const results = await db.query(sql);

    // Convert numeric fields from strings to numbers
    const formattedResults = results.rows.map(row => ({
      ...row,
      totalQuizzes: parseInt(row.totalQuizzes, 10),
      correctAnswers: parseInt(row.correctAnswers, 10),
      score: parseFloat(row.score),
    }));

    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error("Fetch quiz results error:", error);
    return NextResponse.json({ error: "Failed to fetch quiz results" }, { status: 500 });
  }
}