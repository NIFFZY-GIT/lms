import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getServerUser } from '../../../lib/auth';
import { Role } from '../../../types';
import { v4 as uuidv4 } from 'uuid';
import { IMAGE_10MB, assertFile } from '@/lib/security';
import { saveUploadFile, removeUploadByUrl } from '@/lib/uploads';

// GET: Fetch all announcements (public)
export async function GET() {
  try {
    const result = await db.query('SELECT * FROM "Announcement" ORDER BY "createdAt" DESC');
    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

// POST: Create a new announcement (admin only)
export async function POST(req: Request) {
  try {
    const user = await getServerUser(Role.ADMIN);
    const formData = await req.formData();

    const title = formData.get('title') as string; // <-- Get title from form data
    const description = formData.get('description') as string;
    const imageFile = formData.get('image') as File | null;

    if (!title || !description || !imageFile) { // <-- Add title to validation
      return NextResponse.json({ error: 'Title, description, and image are required.' }, { status: 400 });
    }
    try {
      assertFile(imageFile, IMAGE_10MB, 'image');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Invalid file';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // ... (file upload logic remains the same) ...
  const { publicPath } = await saveUploadFile(imageFile, 'announcements');
  const imageUrl = publicPath;
    const announcementId = uuidv4();

    // --- UPDATED SQL QUERY ---
    const sql = 'INSERT INTO "Announcement" (id, title, description, "imageUrl", "createdById") VALUES ($1, $2, $3, $4, $5) RETURNING *;';
    const result = await db.query(sql, [announcementId, title, description, imageUrl, user.id]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Create announcement error:", error);
    return NextResponse.json({ error: 'Failed to create announcement.' }, { status: 500 });
  }
}



// --- NEW: PATCH function for updates ---
export async function PATCH(req: Request, { params }: { params: Promise<{ announcementId: string }> }) {
    try {
        await getServerUser(Role.ADMIN);
        const { announcementId } = await params;
        const formData = await req.formData();

        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const imageFile = formData.get('image') as File | null;

        if (!title || !description) {
            return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 });
        }

        const fieldsToUpdate: string[] = [];
        const values: (string | number)[] = [];
        let queryIndex = 1;

        fieldsToUpdate.push(`title = $${queryIndex++}`);
        values.push(title);
        fieldsToUpdate.push(`description = $${queryIndex++}`);
        values.push(description);

        // If a new image is uploaded, handle file replacement
        if (imageFile) {
            // Find the old image URL to delete it
            const oldImageResult = await db.query('SELECT "imageUrl" FROM "Announcement" WHERE id = $1', [announcementId]);
      if (oldImageResult.rows.length > 0) {
        const oldImageUrl = oldImageResult.rows[0].imageUrl;
        try {
          await removeUploadByUrl(oldImageUrl);
        } catch (e) {
          console.error("Failed to delete old image, but proceeding:", e);
        }
      }

      // Save the new image via helper
      const { publicPath: newImageUrl } = await saveUploadFile(imageFile, 'announcements');
            fieldsToUpdate.push(`"imageUrl" = $${queryIndex++}`);
            values.push(newImageUrl);
        }

        const sql = `
            UPDATE "Announcement"
            SET ${fieldsToUpdate.join(', ')}
            WHERE id = $${queryIndex}
            RETURNING *;
        `;
        values.push(announcementId);

        const result = await db.query(sql, values);
        return NextResponse.json(result.rows[0]);

    } catch (error) {
        console.error("Update announcement error:", error);
        return NextResponse.json({ error: 'Failed to update announcement.' }, { status: 500 });
    }
}