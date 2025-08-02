import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '@/types';

// This function handles saving the Zoom and Recording links.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await getServerUser(Role.ADMIN); // Only Admins can do this
    const { id: courseId } = await params;
    const body = await req.json();
    const { zoomLink, recordingUrl } = body;

    // This is an "UPSERT" operation. It tries to UPDATE an existing material record.
    // If one doesn't exist, it INSERTS a new one. This is very efficient.
    const sql = `
      INSERT INTO "CourseMaterial" (id, "courseId", "zoomLink", "recordingUrl")
      VALUES ($1, $2, $3, $4)
      ON CONFLICT ("courseId") 
      DO UPDATE SET
        "zoomLink" = EXCLUDED."zoomLink",
        "recordingUrl" = EXCLUDED."recordingUrl",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    
    const materialId = uuidv4(); // Generate an ID for the case of insertion
    const result = await db.query(sql, [materialId, courseId, zoomLink, recordingUrl]);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    console.error('Update materials error:', error);
    return NextResponse.json({ error: 'Failed to update materials' }, { status: 500 });
  }
}
