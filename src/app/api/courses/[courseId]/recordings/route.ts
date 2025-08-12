// File: src/app/api/courses/[courseId]/recordings/route.ts
import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { getServerUser } from '../../../../../lib/auth';
import { Role } from '../../../../../types';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { VIDEO_500MB, assertFile, uniqueFileName } from '@/lib/security';

// GET all recordings for a course
export async function GET(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
    try {
        await getServerUser();
        const { courseId } = await params;
        const result = await db.query('SELECT * FROM "Recording" WHERE "courseId" = $1 ORDER BY "createdAt" ASC', [courseId]);
        return NextResponse.json(result.rows);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch recordings' }, { status: 500 });
    }
}

// POST a new recording to a course
export async function POST(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
    try {
        const user = await getServerUser([Role.ADMIN, Role.INSTRUCTOR]);
        const { courseId } = await params;
        if (user.role === Role.INSTRUCTOR) {
            const ownerCheck = await db.query('SELECT "createdById" FROM "Course" WHERE id = $1', [courseId]);
            if (ownerCheck.rows.length === 0) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
            if (ownerCheck.rows[0].createdById !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const formData = await req.formData();

        const title = formData.get('title') as string;
    const videoFile = formData.get('video') as File | null;

                if (!title || !videoFile) {
            return NextResponse.json({ error: 'Title and video file are required.' }, { status: 400 });
        }
                try {
                    assertFile(videoFile, VIDEO_500MB, 'video');
                } catch (e) {
                    const message = e instanceof Error ? e.message : 'Invalid file';
                    return NextResponse.json({ error: message }, { status: 400 });
                }

    const uniqueFilename = uniqueFileName(videoFile.name);
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'recordings');
        await mkdir(uploadDir, { recursive: true });

        const savePath = path.join(uploadDir, uniqueFilename);
        const buffer = Buffer.from(await videoFile.arrayBuffer());
        await writeFile(savePath, buffer);

        const videoUrl = `/uploads/recordings/${uniqueFilename}`;
        const recordingId = uuidv4();

        const sql = 'INSERT INTO "Recording" (id, title, "videoUrl", "courseId") VALUES ($1, $2, $3, $4) RETURNING *;';
        const result = await db.query(sql, [recordingId, title, videoUrl, courseId]);

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error("Upload recording error:", error);
        return NextResponse.json({ error: 'Failed to upload recording.' }, { status: 500 });
    }
}