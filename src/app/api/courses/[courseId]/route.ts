import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { IMAGE_5MB, assertFile, uniqueFileName } from '@/lib/security';

// --- GET function (no changes) ---
export async function GET(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const user = await getServerUser();
    const { courseId } = await params;

    const courseResult = await db.query('SELECT * FROM "Course" WHERE id = $1', [courseId]);
    if (courseResult.rows.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    const course = courseResult.rows[0];
    course.price = parseFloat(course.price);

    const paymentResult = await db.query('SELECT status FROM "Payment" WHERE "studentId" = $1 AND "courseId" = $2', [user.id, courseId]);
    const enrollmentStatus = paymentResult.rows[0]?.status || null;

    if (enrollmentStatus === 'APPROVED') {
      const recordingsResult = await db.query('SELECT * FROM "Recording" WHERE "courseId" = $1 ORDER BY "createdAt" ASC', [courseId]);
      const quizzesResult = await db.query('SELECT id, title FROM "Quiz" WHERE "courseId" = $1 ORDER BY "createdAt" ASC', [courseId]);
      course.recordings = recordingsResult.rows;
      course.quizzes = quizzesResult.rows;
    } else {
      course.recordings = [];
      course.quizzes = [];
    }
    
    return NextResponse.json({ ...course, enrollmentStatus });
  } catch (error) {
    console.error("Fetch course details error:", error);
    return NextResponse.json({ error: 'Failed to fetch course details' }, { status: 500 });
  }
}

// --- PATCH function (no changes) ---
export async function PATCH(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
    try {
        const user = await getServerUser([Role.ADMIN, Role.INSTRUCTOR]);
        const { courseId } = await params;
        if (user.role === Role.INSTRUCTOR) {
            const ownerCheck = await db.query('SELECT "createdById" FROM "Course" WHERE id = $1', [courseId]);
            if (ownerCheck.rows.length === 0) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
            if (ownerCheck.rows[0].createdById !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const formData = await req.formData();

        const fields: string[] = [];
        const values: (string | number)[] = [];
        let queryIndex = 1;

        // Process text fields
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const price = formData.get('price') as string;
        const tutor = formData.get('tutor') as string;
        const zoomLink = formData.get('zoomLink') as string;
        const whatsappGroupLink = formData.get('whatsappGroupLink') as string;
        
        if(title) { fields.push(`title = $${queryIndex++}`); values.push(title); }
        if(description) { fields.push(`description = $${queryIndex++}`); values.push(description); }
        if(price) { fields.push(`price = $${queryIndex++}`); values.push(parseFloat(price)); }
        if(tutor) { fields.push(`tutor = $${queryIndex++}`); values.push(tutor); }
        if(zoomLink) { fields.push(`"zoomLink" = $${queryIndex++}`); values.push(zoomLink); }
        if(whatsappGroupLink) { fields.push(`"whatsappGroupLink" = $${queryIndex++}`); values.push(whatsappGroupLink); }

    const imageFile = formData.get('image') as File | null;
    const removeImage = formData.get('removeImage') as string | null;
        if (imageFile) {
            try {
                assertFile(imageFile, IMAGE_5MB, 'image');
            } catch (e) {
                const message = e instanceof Error ? e.message : 'Invalid file';
                return NextResponse.json({ error: message }, { status: 400 });
            }
            const oldImageResult = await db.query('SELECT "imageUrl" FROM "Course" WHERE id = $1', [courseId]);
            if (oldImageResult.rows.length > 0 && oldImageResult.rows[0].imageUrl) {
                try { await unlink(path.join(process.cwd(), 'public', oldImageResult.rows[0].imageUrl)); } catch (e) { console.error("Failed to delete old image:", e); }
            }
            const uniqueFilename = uniqueFileName(imageFile.name);
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'posters');
            await mkdir(uploadDir, { recursive: true });
            const savePath = path.join(uploadDir, uniqueFilename);
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            await writeFile(savePath, buffer);
            const newImageUrl = `/uploads/posters/${uniqueFilename}`;
            fields.push(`"imageUrl" = $${queryIndex++}`);
            values.push(newImageUrl);
        } else if (removeImage) {
            // Remove existing image without replacement
            const existing = await db.query('SELECT "imageUrl" FROM "Course" WHERE id = $1', [courseId]);
            if (existing.rows.length > 0 && existing.rows[0].imageUrl) {
                try { await unlink(path.join(process.cwd(), 'public', existing.rows[0].imageUrl)); } catch (e) { console.error("Failed to delete old image:", e); }
            }
            fields.push('"imageUrl" = NULL');
        }

        if (fields.length === 0) {
            return NextResponse.json({ error: "No fields to update provided." }, { status: 400 });
        }

        const sql = `
            UPDATE "Course"
            SET ${fields.join(', ')}, "updatedAt" = CURRENT_TIMESTAMP
            WHERE id = $${queryIndex}
            RETURNING *;
        `;
        values.push(courseId);
        
        const result = await db.query(sql, values);
        if (result.rows.length === 0) return NextResponse.json({ error: "Course not found" }, { status: 404 });
        
        const updatedCourse = result.rows[0];
        updatedCourse.price = parseFloat(updatedCourse.price);

        return NextResponse.json(updatedCourse);
    } catch (error) {
        console.error("Update Course Error:", error);
        return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
    }
}


// --- NEW: DELETE function ---
export async function DELETE(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
    try {
        const user = await getServerUser([Role.ADMIN, Role.INSTRUCTOR]);
        const { courseId } = await params;
        if (user.role === Role.INSTRUCTOR) {
            const ownerCheck = await db.query('SELECT "createdById" FROM "Course" WHERE id = $1', [courseId]);
            if (ownerCheck.rows.length === 0) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
            if (ownerCheck.rows[0].createdById !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 1. Find the course to get its image URL before deleting the DB record
        const findResult = await db.query('SELECT "imageUrl" FROM "Course" WHERE id = $1', [courseId]);
        if (findResult.rows.length === 0) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }
        const imageUrl = findResult.rows[0].imageUrl;

        // 2. Delete the course record from the database.
        // ON DELETE CASCADE will handle all related quizzes, recordings, payments, etc.
        await db.query('DELETE FROM "Course" WHERE id = $1', [courseId]);

        // 3. If an image existed, delete the physical file from the server
        if (imageUrl) {
            try {
                const filePath = path.join(process.cwd(), 'public', imageUrl);
                await unlink(filePath);
            } catch (fileError) {
                // Log the error but don't fail the request, as the DB deletion is the most critical part
                console.error("Failed to delete course poster file, but DB record was removed:", fileError);
            }
        }
        
        // 4. Respond with a success status
        return new NextResponse(null, { status: 204 }); // 204 No Content is standard for successful deletion
    } catch (error) {
        console.error("Delete Course Error:", error);
        return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
    }
}