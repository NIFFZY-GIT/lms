import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';
import { IMAGE_10MB, assertFile } from '@/lib/security';
import { saveUploadFile, removeUploadByUrl } from '@/lib/uploads';

// --- PATCH handler for updating an announcement ---
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

        if (imageFile) {
            try {
                assertFile(imageFile, IMAGE_10MB, 'image');
            } catch (e) {
                const message = e instanceof Error ? e.message : 'Invalid file';
                return NextResponse.json({ error: message }, { status: 400 });
            }
            const oldImageResult = await db.query('SELECT "imageUrl" FROM "Announcement" WHERE id = $1', [announcementId]);
            if (oldImageResult.rows.length > 0 && oldImageResult.rows[0].imageUrl) {
                try {
                    await removeUploadByUrl(oldImageResult.rows[0].imageUrl);
                } catch (e) {
                    console.error("Failed to delete old image, but proceeding:", e);
                }
            }

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

        if (result.rows.length === 0) {
            return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);

    } catch (error) {
        console.error("Update announcement error:", error);
        return NextResponse.json({ error: 'Failed to update announcement.' }, { status: 500 });
    }
}


// --- DELETE handler for deleting an announcement ---
export async function DELETE(req: Request, { params }: { params: Promise<{ announcementId: string }> }) {
  try {
    await getServerUser(Role.ADMIN);
    const { announcementId } = await params;

    const findResult = await db.query('SELECT "imageUrl" FROM "Announcement" WHERE id = $1', [announcementId]);
    if (findResult.rows.length === 0) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    await db.query('DELETE FROM "Announcement" WHERE id = $1', [announcementId]);

    const imageUrl = findResult.rows[0].imageUrl;
    if (imageUrl) {
        try {
            await removeUploadByUrl(imageUrl);
        } catch (fileError) {
            console.error("Failed to delete announcement file, but DB record was removed:", fileError);
        }
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete announcement error:", error);
    return NextResponse.json({ error: 'Failed to delete announcement.' }, { status: 500 });
  }
}