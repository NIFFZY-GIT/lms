import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '@/types'; // Assuming you have Role enum in types

export async function GET() {
  try {
    // This part stays the same
    await getServerUser(); 
    const result = await db.query(
      `SELECT c.id, c.title, c.description, c.price, c.tutor, c."whatsappGroupLink", u.name as "createdBy" 
       FROM "Course" c 
       JOIN "User" u ON c."createdById" = u.id 
       ORDER BY c."createdAt" DESC`
    );

    // --- THIS IS THE FIX ---
    // We transform the data before sending it to the client.
    const courses = result.rows.map(course => ({
      ...course,
      // parseFloat will convert the price string (e.g., "50.00") to a number (50).
      price: parseFloat(course.price), 
    }));
    
    return NextResponse.json(courses);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Not Authenticated')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Failed to fetch courses:", error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

// --- THIS IS THE CRITICAL PART ---
// This function must exist and be named POST to handle course creation.
export async function POST(req: Request) {
  try {
    const user = await getServerUser(Role.ADMIN); // Only Admins can create courses
    const body = await req.json();

    // Basic validation
    if (!body.title || !body.description || body.price == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { title, description, price, tutor, whatsappGroupLink } = body;
    const courseId = uuidv4();

    const sql = `
      INSERT INTO "Course" (id, title, description, "createdById", price, tutor, "whatsappGroupLink")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    
    const result = await db.query(sql, [courseId, title, description, user.id, price, tutor, whatsappGroupLink]);
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
        if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
    }
    console.error('Course creation error:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}