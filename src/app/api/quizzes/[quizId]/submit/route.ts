import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db'; // Correct relative path
import { getServerUser } from '../../../../../lib/auth';
import { Role } from '../../../../../types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request, { params }: { params: { quizId: string } }) {
  try {
    const user = await getServerUser(Role.STUDENT); // Only students can submit quizzes
    const { quizId } = params;
    const { selectedAnswerId } = await req.json();

    if (!selectedAnswerId) {
      return NextResponse.json({ error: 'An answer must be selected.' }, { status: 400 });
    }

    // Use a transaction for safety. This ensures all operations succeed or none do.
    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // 1. Check if the user has already attempted this quiz
      const existingAttempt = await client.query(
        'SELECT id FROM "QuizAttempt" WHERE "studentId" = $1 AND "quizId" = $2',
        [user.id, quizId]
      );

      if (existingAttempt.rows.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'You have already attempted this quiz.' }, { status: 409 }); // 409 Conflict
      }

      // 2. Check if the selected answer is correct
      const answerResult = await client.query(
        'SELECT "isCorrect" FROM "QuizAnswer" WHERE id = $1 AND "quizId" = $2',
        [selectedAnswerId, quizId]
      );

      if (answerResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Invalid answer selected.' }, { status: 400 });
      }
      
      const isCorrect = answerResult.rows[0].isCorrect;

      // 3. Record the attempt in the database
      const attemptId = uuidv4();
      await client.query(
        'INSERT INTO "QuizAttempt" (id, "studentId", "quizId", "selectedAnswerId", "isCorrect") VALUES ($1, $2, $3, $4, $5)',
        [attemptId, user.id, quizId, selectedAnswerId, isCorrect]
      );

      // 4. Get the text of the actual correct answer to show the user
      const correctAnswerResult = await client.query(
        'SELECT answer FROM "QuizAnswer" WHERE "quizId" = $1 AND "isCorrect" = TRUE',
        [quizId]
      );
      
      const correctAnswer = correctAnswerResult.rows[0]?.answer || "N/A";

      // 5. Commit the transaction
      await client.query('COMMIT');

      // 6. Return the result to the frontend
      return NextResponse.json({ isCorrect, correctAnswer });

    } catch (e) {
      await client.query('ROLLBACK'); // Roll back all changes if any step fails
      throw e;
    } finally {
      client.release(); // Release the database client back to the pool
    }

  } catch (error) {
    if (error instanceof Error) {
        console.error('Submit quiz error:', error.message);
        if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
  }
}