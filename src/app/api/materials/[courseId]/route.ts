import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';
import { v4 as uuidv4 } from 'uuid';
import { saveUploadFile } from '@/lib/uploads';
import { sendCourseContentUpdateEmail } from '@/lib/notify';

export async function POST(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    await getServerUser(Role.ADMIN);
    const { courseId } = await params;

    const courseResult = await db.query<{ title: string; createdById: string }>(
      'SELECT title, "createdById" FROM "Course" WHERE id = $1',
      [courseId]
    );
    if (courseResult.rows.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    const course = courseResult.rows[0];
    
    const formData = await req.formData();
    const zoomLink = formData.get('zoomLink') as string;
    const recordingFile = formData.get('recording') as File | null;

    let recordingUrl: string | undefined;

    // Handle the file upload if a file was provided
  if (recordingFile) {
    const { publicPath } = await saveUploadFile(recordingFile, 'recordings');
    recordingUrl = publicPath;
  }

    // Upsert logic: Update if exists, insert if not.
    const sql = `
      INSERT INTO "CourseMaterial" (id, "courseId", "zoomLink", "recordingUrl")
      VALUES ($1, $2, $3, $4)
      ON CONFLICT ("courseId") 
      DO UPDATE SET
        "zoomLink" = COALESCE($3, "CourseMaterial"."zoomLink"),
        "recordingUrl" = COALESCE($4, "CourseMaterial"."recordingUrl"),
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    
    const result = await db.query(sql, [uuidv4(), courseId, zoomLink, recordingUrl]);

    try {
      const recipientResult = await db.query<{ email: string | null }>(
        `
        SELECT DISTINCT u.email
        FROM "User" u
        LEFT JOIN "Payment" p ON p."studentId" = u.id
        WHERE u.email IS NOT NULL
          AND (
            u.role = ANY($1)
            OR u.id = $2
            OR (p."courseId" = $3 AND p.status = 'APPROVED')
          )
        `,
        [[Role.ADMIN, Role.INSTRUCTOR], course.createdById, courseId]
      );
      const recipients = recipientResult.rows
        .map((row) => row.email)
        .filter((email): email is string => Boolean(email));

      const contentTitle = zoomLink
        ? 'Zoom/Live session link'
        : recordingFile?.name || 'Course recording material';

      await sendCourseContentUpdateEmail(recipients, {
        courseTitle: course.title,
        contentType: 'MATERIAL',
        contentTitle,
        courseId,
      });
    } catch (emailError) {
      console.error('Course material update email failed:', emailError);
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Update materials error:", error);
    return NextResponse.json({ error: "Failed to update materials" }, { status: 500 });
  }
}