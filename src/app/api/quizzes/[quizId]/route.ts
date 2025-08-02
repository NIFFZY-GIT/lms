// File: src/app/api/quizzes/[quizId]/route.ts

import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';

// GET handler: Fetches a single quiz with its answers.
// Used by admins for editing and by students for taking the quiz.
export async function GET(req: Request, { params }: { params: { quizId: string } }) {
  try {
    await getServerUser(); // Ensure user is authenticated
 const { quizId } = params;
    
    const quizResult = await db.query('SELECT id, question, "courseId" FROM "Quiz" WHERE id = $1', [quizId]);
    if (quizResult.rows.length === 0) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // For students, you might want to remove "isCorrect". For admins, it's fine.
    // Let's assume this is for an admin for now.
    const answersResult = await db.query('SELECT id, answer, "isCorrect" FROM "QuizAnswer" WHERE "quizId" = $1', [quizId]);

    const quiz = { ...quizResult.rows[0], answers: answersResult.rows };
    return NextResponse.json(quiz);
  } catch (error) {
     console.error("Fetch single quiz error:", error);
     return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 });
  }
}

// DELETE handler: Deletes a specific quiz.
export async function DELETE(req: Request, { params }: { params: { quizId: string } }) {
  try {
    await getServerUser(Role.ADMIN); // Admin only
    const { quizId } = params;
    
    // The "ON DELETE CASCADE" in your database schema should automatically delete related answers.
    const result = await db.query('DELETE FROM "Quiz" WHERE id = $1', [quizId]);

    if (result.rowCount === 0) {
        return NextResponse.json({ error: "Quiz not found or already deleted" }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 }); // 204 No Content is standard for a successful DELETE
  } catch (error) {
    console.error("Delete quiz error:", error);
    return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 });
  }
}

// PATCH handler: Updates a quiz's question and answers.
export async function PATCH(req: Request, { params }: { params: { quizId: string } }) {
    try {
        await getServerUser(Role.ADMIN); // Admin only
        const { quizId } = params;
        const { question, answers } = await req.json();

        // Use a transaction to ensure all updates succeed or none do.
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            
            // Update the question
            await client.query('UPDATE "Quiz" SET question = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2;', [question, quizId]);

            // Update each answer
            const updatePromises = answers.map((ans: { id: string, answer: string, isCorrect: boolean }) => {
                return client.query('UPDATE "QuizAnswer" SET answer = $1, "isCorrect" = $2 WHERE id = $3;', [ans.answer, ans.isCorrect, ans.id]);
            });
            await Promise.all(updatePromises);
            
            await client.query('COMMIT'); // Commit all changes
            return NextResponse.json({ message: 'Quiz updated successfully' });
        } catch(e) {
            await client.query('ROLLBACK'); // Roll back on any error
            throw e;
        } finally {
            client.release(); // Release the client back to the pool
        }
    } catch (error) {
        console.error('Update quiz error:', error);
        return NextResponse.json({ error: 'Failed to update quiz' }, { status: 500 });
    }
}