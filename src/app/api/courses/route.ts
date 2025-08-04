import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getServerUser } from '../../../lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '../../../types';

// This GET handler is now PUBLIC. Anyone can see the list of courses.
export async function GET() {
  try {
    const result = await db.query('SELECT * FROM "Course" ORDER BY "createdAt" DESC');
    const courses = result.rows.map(course => ({
      ...course,
      price: parseFloat(course.price),
    }));
    return NextResponse.json(courses);
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

// This POST handler remains PROTECTED. Only admins can create courses.
export async function POST(req: Request) {
  try {
    const user = await getServerUser(Role.ADMIN);
    const body = await req.json();
    const { title, description, price, tutor, whatsappGroupLink } = body;
    const courseId = uuidv4();
    const sql = `
      INSERT INTO "Course" (id, title, description, "createdById", price, tutor, "whatsappGroupLink")
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;`;
    const result = await db.query(sql, [courseId, title, description, user.id, price, tutor, whatsappGroupLink]);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Course creation error:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}