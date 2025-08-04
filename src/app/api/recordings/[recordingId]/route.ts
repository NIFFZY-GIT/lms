// File: src/app/api/recordings/[recordingId]/route.ts
import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';
import { unlink } from 'fs/promises'; // For deleting the file from disk
import path from 'path';

export async function DELETE(req: Request, { params }: { params: Promise<{ recordingId: string }> }) {
    try {
        await getServerUser(Role.ADMIN);
        const { recordingId } = await params;

        // First, find the recording to get its file path
        const findResult = await db.query('SELECT "videoUrl" FROM "Recording" WHERE id = $1', [recordingId]);
        if (findResult.rows.length === 0) {
            return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
        }

        const videoUrl = findResult.rows[0].videoUrl;

        // Delete the record from the database
        await db.query('DELETE FROM "Recording" WHERE id = $1', [recordingId]);

        // Delete the actual file from the public folder
        try {
            const filePath = path.join(process.cwd(), 'public', videoUrl);
            await unlink(filePath);
        } catch (fileError) {
            console.error("Failed to delete file from disk, but DB record was removed:", fileError);
            // Don't throw an error to the user, as the main goal (DB deletion) succeeded.
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Delete recording error:", error);
        return NextResponse.json({ error: 'Failed to delete recording.' }, { status: 500 });
    }
}