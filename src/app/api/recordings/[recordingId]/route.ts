// File: src/app/api/recordings/[recordingId]/route.ts
import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';
import { unlink } from 'fs/promises'; // For deleting the file from disk
import path from 'path';

export async function GET(req: Request, { params }: { params: Promise<{ recordingId: string }> }) {
    try {
        const user = await getServerUser([Role.ADMIN, Role.STUDENT]);
        const { recordingId } = await params;

        const recordingResult = await db.query<{
            videoUrl: string;
            courseId: string;
            courseType: 'ONE_TIME_PURCHASE' | 'SUBSCRIPTION';
        }>(
            `SELECT r."videoUrl", r."courseId", c."courseType"
             FROM "Recording" r
             JOIN "Course" c ON c.id = r."courseId"
             WHERE r.id = $1`,
            [recordingId]
        );

        if (!recordingResult.rows.length) {
            return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
        }

        const recording = recordingResult.rows[0];

        if (user.role === Role.STUDENT) {
            const paymentResult = await db.query<{
                status: 'APPROVED' | 'PENDING' | 'REJECTED';
                subscriptionExpiryDate: string | null;
            }>(
                `SELECT status, "subscriptionExpiryDate"
                 FROM "Payment"
                 WHERE "studentId" = $1 AND "courseId" = $2
                 ORDER BY "createdAt" DESC
                 LIMIT 1`,
                [user.id, recording.courseId]
            );

            const latestPayment = paymentResult.rows[0];
            const hasAccess = Boolean(
                latestPayment && latestPayment.status === 'APPROVED' && (
                    recording.courseType !== 'SUBSCRIPTION' ||
                    (latestPayment.subscriptionExpiryDate && new Date(latestPayment.subscriptionExpiryDate) > new Date())
                )
            );

            if (!hasAccess) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        const videoUrl = recording.videoUrl;

        if (user.role === Role.STUDENT && !videoUrl.startsWith('/')) {
            return NextResponse.json(
                { error: 'External recording links are disabled. Please contact support.' },
                { status: 403 }
            );
        }

        if (videoUrl.startsWith('/')) {
            return NextResponse.redirect(new URL(videoUrl, req.url));
        }

        return NextResponse.redirect(videoUrl);
    } catch (error) {
        console.error('Recording playback error:', error);
        return NextResponse.json({ error: 'Failed to load recording' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ recordingId: string }> }) {
    try {
    const user = await getServerUser([Role.ADMIN, Role.INSTRUCTOR]);
    const { recordingId } = await params;

        // First, find the recording to get its file path
        const findResult = await db.query('SELECT "videoUrl" FROM "Recording" WHERE id = $1', [recordingId]);
        if (findResult.rows.length === 0) {
            return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
        }

        const videoUrl = findResult.rows[0].videoUrl;

        // Ownership check if instructor
        if (user.role === Role.INSTRUCTOR) {
            const ownership = await db.query(`SELECT c."createdById" FROM "Recording" r JOIN "Course" c ON r."courseId" = c.id WHERE r.id = $1`, [recordingId]);
            if (ownership.rows.length === 0) return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
            if (ownership.rows[0].createdById !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete the record from the database
        await db.query('DELETE FROM "Recording" WHERE id = $1', [recordingId]);

        // Delete local uploaded files only. External URLs do not map to the local filesystem.
        if (typeof videoUrl === 'string' && videoUrl.startsWith('/uploads/')) {
            try {
                const filePath = path.join(process.cwd(), 'public', videoUrl);
                await unlink(filePath);
            } catch (fileError) {
                console.error("Failed to delete file from disk, but DB record was removed:", fileError);
                // Don't throw an error to the user, as the main goal (DB deletion) succeeded.
            }
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Delete recording error:", error);
        return NextResponse.json({ error: 'Failed to delete recording.' }, { status: 500 });
    }
}