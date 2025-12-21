import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getServerUser } from '../../../lib/auth';
import { Role } from '../../../types';
import { v4 as uuidv4 } from 'uuid';
import { IMAGE_10MB, assertFile } from '@/lib/security';
import { saveUploadFile } from '@/lib/uploads';
import { sendAnnouncementPublishedEmail } from '@/lib/notify';

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
    const announcement = result.rows[0];

    try {
      const recipientResult = await db.query<{ email: string | null }>(
        'SELECT email FROM "User" WHERE role = ANY($1) AND email IS NOT NULL',
        [[Role.STUDENT, Role.INSTRUCTOR]]
      );
      const recipients = recipientResult.rows
        .map((row) => row.email)
        .filter((email): email is string => Boolean(email));

      if (recipients.length) {
        const summary = description.length > 240 ? `${description.slice(0, 237)}...` : description;
        await sendAnnouncementPublishedEmail(recipients, {
          title,
          summary,
          imageUrl,
          announcementId,
        });
      }
    } catch (emailError) {
      console.error('Announcement email failed:', emailError);
    }

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("Create announcement error:", error);
    return NextResponse.json({ error: 'Failed to create announcement.' }, { status: 500 });
  }
}