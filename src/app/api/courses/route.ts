import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getServerUser } from '../../../lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '../../../types';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// GET handler (no changes needed)
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

// POST handler (UPDATED to handle file uploads)
export async function POST(req: Request) {
  try {
    const user = await getServerUser(Role.ADMIN);
    const formData = await req.formData();

    // Get text fields from FormData
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const tutor = formData.get('tutor') as string | null;
    const whatsappGroupLink = formData.get('whatsappGroupLink') as string | null;
    
    // Get the optional image file
    const imageFile = formData.get('image') as File | null;

    if (!title || !description || isNaN(price)) {
        return NextResponse.json({ error: 'Title, description, and price are required.' }, { status: 400 });
    }

    let imageUrl: string | null = null;
    if (imageFile) {
        // Save the file to the server
        const uniqueFilename = `${Date.now()}-${imageFile.name.replace(/\s+/g, '_')}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'posters');
        await mkdir(uploadDir, { recursive: true });
        
        const savePath = path.join(uploadDir, uniqueFilename);
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        await writeFile(savePath, buffer);
        
        // Store the public URL
        imageUrl = `/uploads/posters/${uniqueFilename}`;
    }

    const courseId = uuidv4();
    const sql = `
      INSERT INTO "Course" (id, title, description, "createdById", price, tutor, "whatsappGroupLink", "imageUrl")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;`;
    const result = await db.query(sql, [courseId, title, description, user.id, price, tutor, whatsappGroupLink, imageUrl]);
    
    const newCourse = result.rows[0];
    newCourse.price = parseFloat(newCourse.price);
    
    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    console.error('Course creation error:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}