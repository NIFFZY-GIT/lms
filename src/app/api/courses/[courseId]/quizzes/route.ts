import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface AnswerInput {
  answer: string;
  isCorrect: boolean;
}

// Get all quizzes for a course
export async function GET(req: Request, { params }: { params: { courseId: string } }) {
  try {
    await getServerUser(Role.ADMIN);
    const { courseId } = params;

    const quizzesQuery = `
      SELECT q.id, q.question, q."courseId"
      FROM "Quiz" q
      WHERE q."courseId" = $1
      ORDER BY q."createdAt" ASC;
    `;

    const quizzesResult = await db.query(quizzesQuery, [courseId]);
    
    // For each quiz, get its answers
    const quizzes = await Promise.all(
      quizzesResult.rows.map(async (quiz) => {
        const answersQuery = `
          SELECT id, answer, "isCorrect"
          FROM "Answer"
          WHERE "quizId" = $1
          ORDER BY id;
        `;
        const answersResult = await db.query(answersQuery, [quiz.id]);
        
        return {
          ...quiz,
          answers: answersResult.rows,
        };
      })
    );

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error('Fetch quizzes error:', error);
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
  }
}

// Create a new quiz
export async function POST(req: Request, { params }: { params: { courseId: string } }) {
  try {
    await getServerUser(Role.ADMIN);
    const { courseId } = params;
    const body = await req.json();
    const { question, answers } = body;

    if (!question || !answers || !Array.isArray(answers) || answers.length < 2) {
      return NextResponse.json({ 
        error: 'Question and at least 2 answers are required' 
      }, { status: 400 });
    }

    // Check that exactly one answer is marked as correct
    const correctAnswers = answers.filter(answer => answer.isCorrect);
    if (correctAnswers.length !== 1) {
      return NextResponse.json({ 
        error: 'Exactly one answer must be marked as correct' 
      }, { status: 400 });
    }

    // Create the quiz
    const quizId = uuidv4();
    const quizQuery = `
      INSERT INTO "Quiz" (id, question, "courseId")
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    const quizResult = await db.query(quizQuery, [quizId, question, courseId]);
    const quiz = quizResult.rows[0];

    // Create the answers
    const answerPromises = answers.map((answer: AnswerInput) => {
      const answerId = uuidv4();
      const answerQuery = `
        INSERT INTO "Answer" (id, answer, "isCorrect", "quizId")
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      return db.query(answerQuery, [answerId, answer.answer, answer.isCorrect, quizId]);
    });

    const answerResults = await Promise.all(answerPromises);
    const createdAnswers = answerResults.map(result => result.rows[0]);

    return NextResponse.json({
      ...quiz,
      answers: createdAnswers,
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
  }
}
