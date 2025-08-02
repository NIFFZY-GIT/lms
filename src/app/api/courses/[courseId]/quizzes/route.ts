import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { getServerUser } from '../../../../../lib/auth';
import { Role } from '../../../../../types';
import { v4 as uuidv4 } from 'uuid';

interface AnswerInput {
  answer: string;
  isCorrect: boolean;
}

// GET Handler
export async function GET(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    await getServerUser();
    const { courseId } = await params; // FIX: Await the params object

    const quizzesResult = await db.query(
      'SELECT id, question FROM "Quiz" WHERE "courseId" = $1 ORDER BY "createdAt" ASC',
      [courseId]
    );
    
    return NextResponse.json(quizzesResult.rows);
  } catch (error) {
    console.error('Fetch quizzes error:', error);
    if (error instanceof Error && (error.message.includes('Forbidden') || error.message.includes('Unauthorized'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
  }
}

// POST Handler
export async function POST(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    await getServerUser(Role.ADMIN);
    const { courseId } = await params; // FIX: Await the params object
    const { question, answers } = await req.json();

    if (!question || !Array.isArray(answers) || answers.length !== 4) {
      return NextResponse.json({ error: 'Question and exactly 4 answers are required.' }, { status: 400 });
    }
    if (answers.filter(a => a.isCorrect).length !== 1) {
      return NextResponse.json({ error: 'Exactly one answer must be marked as correct.' }, { status: 400 });
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const quizId = uuidv4();
      const quizQuery = 'INSERT INTO "Quiz" (id, question, "courseId") VALUES ($1, $2, $3) RETURNING *;';
      const quizResult = await client.query(quizQuery, [quizId, question, courseId]);
      
      const answerPromises = answers.map((answer: AnswerInput) => {
        const answerQuery = 'INSERT INTO "QuizAnswer" (id, answer, "isCorrect", "quizId") VALUES ($1, $2, $3, $4);';
        return client.query(answerQuery, [uuidv4(), answer.answer, answer.isCorrect, quizId]);
      });
      await Promise.all(answerPromises);
      
      await client.query('COMMIT');
      return NextResponse.json(quizResult.rows[0], { status: 201 });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create quiz error:', error);
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
  }
}