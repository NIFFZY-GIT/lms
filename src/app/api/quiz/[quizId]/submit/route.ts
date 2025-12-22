import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';

// Submit a quiz answer
export async function POST(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    // Ensure user is authenticated
    await getServerUser();
    const { quizId } = await params;
    const body = await req.json();
    const { selectedAnswerId } = body;

    if (!selectedAnswerId) {
      return NextResponse.json({ error: 'Answer selection is required' }, { status: 400 });
    }

    // Check if the selected answer is correct
    const answerQuery = `
      SELECT a.*, q.question
      FROM "Answer" a
      JOIN "Quiz" q ON a."quizId" = q.id
      WHERE a.id = $1 AND a."quizId" = $2;
    `;

    const answerResult = await db.query(answerQuery, [selectedAnswerId, quizId]);
    
    if (answerResult.rows.length === 0) {
      return NextResponse.json({ error: "Invalid answer selection" }, { status: 400 });
    }

    const selectedAnswer = answerResult.rows[0];
    const isCorrect = selectedAnswer.isCorrect;

    // Get the correct answer for feedback (if the user got it wrong)
    let correctAnswer = null;
    if (!isCorrect) {
      const correctAnswerQuery = `
        SELECT answer
        FROM "Answer"
        WHERE "quizId" = $1 AND "isCorrect" = true;
      `;
      const correctResult = await db.query(correctAnswerQuery, [quizId]);
      if (correctResult.rows.length > 0) {
        correctAnswer = correctResult.rows[0].answer;
      }
    }

    // Optionally, you could save the user's quiz attempt to the database here
    // For now, we'll just return the result

    return NextResponse.json({
      isCorrect,
      correctAnswer,
      selectedAnswer: selectedAnswer.answer,
    });
  } catch (error) {
    console.error('Quiz submission error:', error);
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
  }
}
