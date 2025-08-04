import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { getServerUser } from '../../../../../lib/auth';
import { Role } from '../../../../../types';
import { v4 as uuidv4 } from 'uuid';

interface AnswerInput { answerText: string; isCorrect: boolean; }

// GET all questions (with their answers) for a specific quiz
export async function GET(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    await getServerUser();
    const { quizId } = await params;

    const questionsResult = await db.query('SELECT * FROM "Question" WHERE "quizId" = $1 ORDER BY "createdAt" ASC', [quizId]);
    
    const questions = await Promise.all(
      questionsResult.rows.map(async (question) => {
        const answersResult = await db.query('SELECT * FROM "Answer" WHERE "questionId" = $1 ORDER BY id ASC', [question.id]);
        return { ...question, answers: answersResult.rows };
      })
    );
    return NextResponse.json(questions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

// POST a new question (with answers) to a specific quiz
export async function POST(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    await getServerUser(Role.ADMIN);
    const { quizId } = await params;
    const { questionText, answers } = await req.json();

    if (!questionText || !Array.isArray(answers) || answers.length !== 4) {
      return NextResponse.json({ error: 'Question text and exactly 4 answers are required.' }, { status: 400 });
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const questionId = uuidv4();
      const questionQuery = 'INSERT INTO "Question" (id, "questionText", "quizId") VALUES ($1, $2, $3) RETURNING *;';
      const questionResult = await client.query(questionQuery, [questionId, questionText, quizId]);
      
      const answerPromises = answers.map((answer: AnswerInput) => {
        const answerQuery = 'INSERT INTO "Answer" (id, "answerText", "isCorrect", "questionId") VALUES ($1, $2, $3, $4);';
        return client.query(answerQuery, [uuidv4(), answer.answerText, answer.isCorrect, questionId]);
      });
      await Promise.all(answerPromises);
      
      await client.query('COMMIT');
      return NextResponse.json(questionResult.rows[0], { status: 201 });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}