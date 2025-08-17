import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';
import { v4 as uuidv4 } from 'uuid';
import { saveUploadFile } from '@/lib/uploads';

export async function POST(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    await getServerUser(Role.ADMIN);
    const { courseId } = await params;
    
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
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Update materials error:", error);
    return NextResponse.json({ error: "Failed to update materials" }, { status: 500 });
  }
}