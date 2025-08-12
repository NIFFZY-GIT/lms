import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';

// GET handler: Fetches a single quiz, its questions, and its answers (for a student taking a quiz).
export async function GET(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    await getServerUser(); // Ensure user is authenticated
    const { quizId } = await params; // <-- FIX: Await the params

    // 1. Fetch the main quiz details (title, courseId)
    const quizResult = await db.query(
      // --- FIX: Select 'title', not 'question' ---
      'SELECT id, title, "courseId" FROM "Quiz" WHERE id = $1',
      [quizId]
    );
    if (quizResult.rows.length === 0) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    const quiz = quizResult.rows[0];

    // 2. Fetch all questions for this quiz
    const questionsResult = await db.query(
      'SELECT id, "questionText", "imageUrl" FROM "Question" WHERE "quizId" = $1 ORDER BY "createdAt" ASC',
      [quizId]
    );
    
    // 3. For each question, fetch its answers (without revealing which is correct)
    const questionsWithAnswers = await Promise.all(
      questionsResult.rows.map(async (question) => {
        const answersResult = await db.query(
          'SELECT id, "answerText" FROM "Answer" WHERE "questionId" = $1 ORDER BY RANDOM()', // Shuffle answers
          [question.id]
        );
  return { ...question, answers: answersResult.rows };
      })
    );

    // 4. Assemble the final quiz object
    const fullQuizPayload = { 
      ...quiz, 
      questions: questionsWithAnswers 
    };
    
    return NextResponse.json(fullQuizPayload);
  } catch (error) {
     console.error("Fetch single quiz error:", error);
     return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 });
  }
}

// DELETE handler: Deletes a specific quiz.
export async function DELETE(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    const user = await getServerUser([Role.ADMIN, Role.INSTRUCTOR]);
    const { quizId } = await params; // <-- FIX: Await the params

    if (user.role === Role.INSTRUCTOR) {
      const ownership = await db.query(`SELECT c."createdById" FROM "Quiz" q JOIN "Course" c ON q."courseId" = c.id WHERE q.id = $1`, [quizId]);
      if (ownership.rows.length === 0) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
      if (ownership.rows[0].createdById !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.query('DELETE FROM "Quiz" WHERE id = $1', [quizId]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete quiz error:", error);
    return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 });
  }
}

// PATCH handler: Updates a Quiz's title.
export async function PATCH(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
    try {
        const user = await getServerUser([Role.ADMIN, Role.INSTRUCTOR]);
        const { quizId } = await params; // <-- FIX: Await the params
        const { title } = await req.json();

        if (user.role === Role.INSTRUCTOR) {
          const ownership = await db.query(`SELECT c."createdById" FROM "Quiz" q JOIN "Course" c ON q."courseId" = c.id WHERE q.id = $1`, [quizId]);
          if (ownership.rows.length === 0) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
          if (ownership.rows[0].createdById !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!title) {
          return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
        }
        
        const result = await db.query(
          'UPDATE "Quiz" SET title = $1 WHERE id = $2 RETURNING *;', 
          [title, quizId]
        );
        
        if (result.rows.length === 0) {
          return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
        }
        
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Update quiz error:', error);
        return NextResponse.json({ error: 'Failed to update quiz' }, { status: 500 });
    }
}