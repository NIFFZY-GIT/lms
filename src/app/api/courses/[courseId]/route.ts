import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';

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
      // OLD, PROBLEMATIC QUERY
// NEW, CORRECTED QUERY
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

export async function PATCH(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
    try {
        await getServerUser(Role.ADMIN);
        const { courseId } = await params;
        const body = await req.json();

        // --- THIS IS THE FIX ---
        // Provide explicit types for the arrays.
        const fields: string[] = [];
        const values: (string | number)[] = [];
        let queryIndex = 1;

        // Use a more robust check for properties that can be updated.
        const allowedUpdates = ['title', 'description', 'price', 'tutor', 'zoomLink', 'whatsappGroupLink'];

        Object.keys(body).forEach(key => {
            if (allowedUpdates.includes(key) && body[key] !== undefined) {
                // Convert camelCase to snake_case for column names, e.g., zoomLink -> "zoomLink"
                const columnName = `"${key}"`;
                fields.push(`${columnName} = $${queryIndex++}`);
                values.push(body[key]);
            }
        });

        if (fields.length === 0) {
            return NextResponse.json({ error: "No valid fields to update provided." }, { status: 400 });
        }

        const sql = `
            UPDATE "Course"
            SET ${fields.join(', ')}, "updatedAt" = CURRENT_TIMESTAMP
            WHERE id = $${queryIndex}
            RETURNING *;
        `;
        values.push(courseId);
        
        const result = await db.query(sql, values);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error("Update Course Error:", error);
        return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
    }
}