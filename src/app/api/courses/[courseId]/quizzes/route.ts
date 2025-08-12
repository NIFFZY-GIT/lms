import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { getServerUser } from '../../../../../lib/auth';
import { Role } from '../../../../../types';
import { v4 as uuidv4 } from 'uuid';

// GET all quizzes (containers) for a course
export async function GET(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    await getServerUser();
    const { courseId } = await params;

    // --- THIS IS THE FIX ---
    // Select 'title' instead of the non-existent 'question' column
    const quizzesResult = await db.query(
      'SELECT id, title FROM "Quiz" WHERE "courseId" = $1 ORDER BY "createdAt" ASC',
      [courseId]
    );
    
    return NextResponse.json(quizzesResult.rows);
  } catch (error) {
    console.error('Fetch quizzes error:', error);
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
  }
}

// POST a new quiz (container)
export async function POST(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const user = await getServerUser([Role.ADMIN, Role.INSTRUCTOR]);
    const { courseId } = await params;
    const { title } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'A title is required to create a quiz.' }, { status: 400 });
    }

    // Ownership check for instructors
    if (user.role === Role.INSTRUCTOR) {
      const owner = await db.query('SELECT "createdById" FROM "Course" WHERE id = $1', [courseId]);
      if (owner.rows.length === 0) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      if (owner.rows[0].createdById !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const quizId = uuidv4();
    const sql = `
      INSERT INTO "Quiz" (id, title, "courseId")
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await db.query(sql, [quizId, title, courseId]);
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Create quiz error:', error);
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
  }
}