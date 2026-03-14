import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getServerUser } from '../../../lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '../../../types';
import { IMAGE_5MB, assertFile } from '@/lib/security';
import { saveUploadFile } from '@/lib/uploads';
import { ensureCourseVisibilityColumn } from '@/lib/course-visibility';

// GET handler (no changes needed)
export async function GET(req: Request) {
  try {
    await ensureCourseVisibilityColumn();

    const { searchParams } = new URL(req.url);
    const mine = searchParams.get('mine');
    let rows;
    if (mine === '1') {
      // attempt to get user (admin or instructor). If fails, return unauthorized.
      try {
      const user = await getServerUser([Role.ADMIN, Role.INSTRUCTOR]);
        const result = await db.query('SELECT * FROM "Course" WHERE "createdById" = $1 ORDER BY "createdAt" DESC', [user.id]);
        rows = result.rows;
      } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      try {
        await getServerUser(Role.ADMIN);
        const result = await db.query('SELECT * FROM "Course" ORDER BY "createdAt" DESC');
        rows = result.rows;
      } catch {
        const result = await db.query('SELECT * FROM "Course" WHERE "isHidden" = FALSE ORDER BY "createdAt" DESC');
        rows = result.rows;
      }
    }
    const courses = rows.map(course => ({
      ...course,
      price: parseFloat(course.price),
    }));
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

// POST handler (UPDATED to handle file uploads and course types)
export async function POST(req: Request) {
  try {
  await ensureCourseVisibilityColumn();
  const user = await getServerUser([Role.ADMIN, Role.INSTRUCTOR]);
    const formData = await req.formData();

    // Get text fields from FormData
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const tutor = formData.get('tutor') as string | null;
    const whatsappGroupLink = formData.get('whatsappGroupLink') as string | null;
    const subjectRaw = formData.get('subject');
    const gradeRaw = formData.get('grade');
    const mediumRaw = formData.get('medium');
    const subject = typeof subjectRaw === 'string' && subjectRaw.trim() ? subjectRaw.trim() : null;
    const grade = typeof gradeRaw === 'string' && gradeRaw.trim() ? gradeRaw.trim() : null;
    const medium = typeof mediumRaw === 'string' && mediumRaw.trim() ? mediumRaw.trim() : null;
    const courseType = (formData.get('courseType') as string) || 'ONE_TIME_PURCHASE';
    
    // Get the optional image file
  const imageFile = formData.get('image') as File | null;

    if (!title || !description || isNaN(price)) {
        return NextResponse.json({ error: 'Title, description, and price are required.' }, { status: 400 });
    }

    let imageUrl: string | null = null;
  if (imageFile) {
        // validate and save the file to the server
        try {
          assertFile(imageFile, IMAGE_5MB, 'image');
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Invalid file';
          return NextResponse.json({ error: message }, { status: 400 });
        }
    const { publicPath } = await saveUploadFile(imageFile, 'posters');
    imageUrl = publicPath;
    }

    const courseId = uuidv4();
    const sql = `
      INSERT INTO "Course" (id, title, description, "createdById", price, tutor, "whatsappGroupLink", "imageUrl", "courseType", subject, grade, medium)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *;`;
    const result = await db.query(sql, [courseId, title, description, user.id, price, tutor, whatsappGroupLink, imageUrl, courseType, subject, grade, medium]);
    
    const newCourse = result.rows[0];
    newCourse.price = parseFloat(newCourse.price);
    
    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    console.error('Course creation error:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}