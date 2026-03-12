import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { getServerUser } from '../../../../../lib/auth';
import { Role } from '../../../../../types';
import { v4 as uuidv4 } from 'uuid';
import { IMAGE_OR_PDF_25MB, assertFile } from '@/lib/security';
import { saveUploadFile } from '@/lib/uploads';

// GET all tutorials for a course (any authenticated user)
export async function GET(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
    try {
        await getServerUser();
        const { courseId } = await params;
        const result = await db.query(
            'SELECT * FROM "CourseTutorial" WHERE "courseId" = $1 ORDER BY "createdAt" ASC',
            [courseId]
        );
        return NextResponse.json(result.rows);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch tutorials' }, { status: 500 });
    }
}

// POST a new tutorial to a course (admin/instructor only)
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
        const title = (formData.get('title') as string | null)?.trim();
        const file = formData.get('file') as File | null;

        if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });

        try {
            assertFile(file, IMAGE_OR_PDF_25MB, 'tutorial file');
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Invalid file';
            return NextResponse.json({ error: message }, { status: 400 });
        }

        const uploadResult = await saveUploadFile(file!, 'tutorials');
        const id = uuidv4();
        const sql = 'INSERT INTO "CourseTutorial" (id, title, "fileUrl", "courseId") VALUES ($1, $2, $3, $4) RETURNING *;';
        const result = await db.query(sql, [id, title, uploadResult.publicPath, courseId]);

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error('Upload tutorial error:', error);
        return NextResponse.json({ error: 'Failed to upload tutorial.' }, { status: 500 });
    }
}
