import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role } from '@/types';

// Handles GETTING a single course's details
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id: courseId } = params;

    const sql = `
      SELECT * FROM "Course"
      WHERE id = $1;
    `;

    const result = await db.query(sql, [courseId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Course fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}

// Handles UPDATING a course's details
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await getServerUser(Role.ADMIN);
    const { id: courseId } = params;
    const body = await req.json();
    const { title, description, price, tutor, whatsappGroupLink } = body;

    const sql = `
      UPDATE "Course"
      SET 
        title = $1,
        description = $2,
        price = $3,
        tutor = $4,
        "whatsappGroupLink" = $5,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *;
    `;

    const result = await db.query(sql, [title, description, price, tutor, whatsappGroupLink, courseId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Course update error:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

// Handles DELETING a course
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await getServerUser(Role.ADMIN);
    const { id: courseId } = params;

    // First, delete related materials and quizzes (if any)
    await db.query('DELETE FROM "CourseMaterial" WHERE "courseId" = $1', [courseId]);
    await db.query('DELETE FROM "Quiz" WHERE "courseId" = $1', [courseId]);
    
    // Then delete the course itself
    const sql = `
      DELETE FROM "Course"
      WHERE id = $1
      RETURNING *;
    `;

    const result = await db.query(sql, [courseId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error('Course deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}