// File: src/app/api/courses/[courseId]/recordings/route.ts
import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { getServerUser } from '../../../../../lib/auth';
import { Role } from '../../../../../types';
import { v4 as uuidv4 } from 'uuid';
import { VIDEO_500MB, assertFile } from '@/lib/security';
import { saveUploadFile } from '@/lib/uploads';
import { sendCourseContentUpdateEmail } from '@/lib/notify';

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
        const courseResult = await db.query<{ title: string; createdById: string }>(
            'SELECT title, "createdById" FROM "Course" WHERE id = $1',
            [courseId]
        );
        if (courseResult.rows.length === 0) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }
        const course = courseResult.rows[0];

        if (user.role === Role.INSTRUCTOR) {
            if (course.createdById !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const formData = await req.formData();

        const title = formData.get('title') as string;
        const recordingType = (formData.get('recordingType') as string | null) ?? 'file';
        const videoFile = formData.get('video') as File | null;
        const videoLink = (formData.get('videoLink') as string | null)?.trim() || null;

        if (!title) {
            return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
        }

        let videoUrl = '';
        if (recordingType === 'link') {
            if (!videoLink) {
                return NextResponse.json({ error: 'Recording link is required.' }, { status: 400 });
            }
            try {
                const url = new URL(videoLink);
                if (!['http:', 'https:'].includes(url.protocol)) {
                    return NextResponse.json({ error: 'Recording link must use http or https.' }, { status: 400 });
                }
                videoUrl = videoLink;
            } catch {
                return NextResponse.json({ error: 'Recording link is invalid.' }, { status: 400 });
            }
        } else {
            if (!videoFile) {
                return NextResponse.json({ error: 'Video file is required.' }, { status: 400 });
            }
            try {
                assertFile(videoFile, VIDEO_500MB, 'video');
            } catch (e) {
                const message = e instanceof Error ? e.message : 'Invalid file';
                return NextResponse.json({ error: message }, { status: 400 });
            }

            const uploadResult = await saveUploadFile(videoFile, 'recordings');
            videoUrl = uploadResult.publicPath;
        }

        const recordingId = uuidv4();

        const sql = 'INSERT INTO "Recording" (id, title, "videoUrl", "courseId") VALUES ($1, $2, $3, $4) RETURNING *;';
        const result = await db.query(sql, [recordingId, title, videoUrl, courseId]);

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

            await sendCourseContentUpdateEmail(recipients, {
                courseTitle: course.title,
                contentType: 'RECORDING',
                contentTitle: title,
                courseId,
            });
        } catch (emailError) {
            console.error('Recording notification email failed:', emailError);
        }

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error("Upload recording error:", error);
        return NextResponse.json({ error: 'Failed to upload recording.' }, { status: 500 });
    }
}