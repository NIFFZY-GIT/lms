import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getServerUser } from '../../../lib/auth';
import { Role } from '../../../types';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

// GET: Fetch all announcements (public)
export async function GET() {
  try {
    const result = await db.query('SELECT * FROM "Announcement" ORDER BY "createdAt" DESC');
    return NextResponse.json(result.rows);
  } catch (error) {
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

    // ... (file upload logic remains the same) ...
    const uniqueFilename = `${Date.now()}-${imageFile.name.replace(/\s+/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'announcements');
    await mkdir(uploadDir, { recursive: true });
    
    const savePath = path.join(uploadDir, uniqueFilename);
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    await writeFile(savePath, buffer);

    const imageUrl = `/uploads/announcements/${uniqueFilename}`;
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
                    await unlink(path.join(process.cwd(), 'public', oldImageUrl));
                } catch (e) {
                    console.error("Failed to delete old image, but proceeding:", e);
                }
            }

            // Save the new image
            const uniqueFilename = `${Date.now()}-${imageFile.name.replace(/\s+/g, '_')}`;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'announcements');
            await mkdir(uploadDir, { recursive: true });
            
            const savePath = path.join(uploadDir, uniqueFilename);
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            await writeFile(savePath, buffer);
            
            const newImageUrl = `/uploads/announcements/${uniqueFilename}`;
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