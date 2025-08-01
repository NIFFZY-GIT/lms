import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';

// Get a single quiz
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // Ensure user is authenticated
    await getServerUser();
    const { id: quizId } = params;

    // Get the quiz with its answers
    const quizQuery = `
      SELECT q.*, c."title" as course_title, c."id" as course_id
      FROM "Quiz" q
      JOIN "Course" c ON q."courseId" = c.id
      WHERE q.id = $1;
    `;

    const quizResult = await db.query(quizQuery, [quizId]);
    
    if (quizResult.rows.length === 0) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const quiz = quizResult.rows[0];

    // Get the answers for this quiz
    const answersQuery = `
      SELECT id, answer, "isCorrect"
      FROM "Answer"
      WHERE "quizId" = $1
      ORDER BY id;
    `;

    const answersResult = await db.query(answersQuery, [quizId]);

    const response = {
      id: quiz.id,
      question: quiz.question,
      courseId: quiz.course_id,
      answers: answersResult.rows,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Quiz fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 });
  }
}
