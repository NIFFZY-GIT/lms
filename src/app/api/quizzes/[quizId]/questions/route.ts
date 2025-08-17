import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { getServerUser } from '../../../../../lib/auth';
import { Role } from '../../../../../types';
import { v4 as uuidv4 } from 'uuid';
import { IMAGE_5MB, assertFile } from '@/lib/security';
import { saveUploadFile } from '@/lib/uploads';

interface AnswerInput { answerText: string; isCorrect: boolean; }

// GET all questions (with their answers) for a specific quiz
export async function GET(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    await getServerUser();
    const { quizId } = await params;
  const questionsResult = await db.query('SELECT id, "questionText", "imageUrl" FROM "Question" WHERE "quizId" = $1 ORDER BY "createdAt" ASC', [quizId]);
    
    const questions = await Promise.all(
      questionsResult.rows.map(async (question) => {
        const answersResult = await db.query('SELECT id, "answerText", "isCorrect" FROM "Answer" WHERE "questionId" = $1 ORDER BY id ASC', [question.id]);
        return { ...question, answers: answersResult.rows };
      })
    );
    return NextResponse.json(questions);
  } catch (error) {
    console.error('GET /api/quizzes/[quizId]/questions failed:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

// POST a new question (with answers) to a specific quiz
export async function POST(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    const user = await getServerUser([Role.ADMIN, Role.INSTRUCTOR]);
    const { quizId } = await params;
    // Accept multipart/form-data to allow optional image upload. Fallback to JSON for backward compatibility.
    let questionText: string | null = null;
    let answers: AnswerInput[] | null = null;
    let uploadedFile: File | null = null;

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      questionText = (formData.get('questionText') as string) || '';
      const answersRaw = formData.get('answers') as string | null;
      try {
        answers = answersRaw ? JSON.parse(answersRaw) : null;
      } catch {
        return NextResponse.json({ error: 'Invalid answers payload.' }, { status: 400 });
      }
      uploadedFile = formData.get('image') as File | null;
    } else {
      const body = await req.json();
      questionText = body.questionText ?? '';
      answers = body.answers ?? null;
    }

    if ((!questionText || questionText.trim().length === 0) && !uploadedFile) {
      return NextResponse.json({ error: 'Provide questionText or an image.' }, { status: 400 });
    }
    if (!Array.isArray(answers) || answers.length !== 4) {
      return NextResponse.json({ error: 'Exactly 4 answers are required.' }, { status: 400 });
    }
    if (answers.filter(a => !!a.isCorrect).length !== 1) {
      return NextResponse.json({ error: 'Exactly one answer must be marked as correct.' }, { status: 400 });
    }

    // Ownership check for instructor: join Quiz -> Course
    if (user.role === Role.INSTRUCTOR) {
      const ownership = await db.query(`SELECT c."createdById" FROM "Quiz" q JOIN "Course" c ON q."courseId" = c.id WHERE q.id = $1`, [quizId]);
      if (ownership.rows.length === 0) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
      if (ownership.rows[0].createdById !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const questionId = uuidv4();
      let imageUrl: string | null = null;
      if (uploadedFile) {
        try { assertFile(uploadedFile, IMAGE_5MB, 'image'); } catch (e) {
          const message = e instanceof Error ? e.message : 'Invalid image';
          return NextResponse.json({ error: message }, { status: 400 });
        }
        const { publicPath } = await saveUploadFile(uploadedFile, 'quizzes');
        imageUrl = publicPath;
      }

  const questionQuery = 'INSERT INTO "Question" (id, "questionText", "imageUrl", "quizId") VALUES ($1, $2, $3, $4) RETURNING *;';
  // Use empty string if no text provided to be compatible with NOT NULL schemas
  const safeQuestionText = (questionText ?? '').toString();
  const questionResult = await client.query(questionQuery, [questionId, safeQuestionText, imageUrl, quizId]);
      
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
  } catch (error: unknown) {
    console.error('POST /api/quizzes/[quizId]/questions failed:', error);
    const err = error as { code?: string; message?: string };
    if (err?.code === '42703' && err?.message?.includes('imageUrl') && err?.message?.includes('Question')) {
      // Postgres undefined_column for imageUrl -> migration not applied
      return NextResponse.json({ error: 'Database is missing column "imageUrl" on table "Question". Apply the migration in db/migrations to proceed.' }, { status: 500 });
    }
    if (err?.code === '23502' && err?.message?.includes('questionText')) {
      // NOT NULL violation on questionText -> make it nullable for image-only questions
      return NextResponse.json({ error: 'Column "questionText" is NOT NULL. Apply migration 20250812_make_questionText_nullable.sql to allow image-only questions.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}