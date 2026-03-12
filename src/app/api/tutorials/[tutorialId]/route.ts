import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';
import { removeUploadByUrl } from '@/lib/uploads';

export async function DELETE(req: Request, { params }: { params: Promise<{ tutorialId: string }> }) {
    try {
        const user = await getServerUser([Role.ADMIN, Role.INSTRUCTOR]);
        const { tutorialId } = await params;

        const existing = await db.query('SELECT * FROM "CourseTutorial" WHERE id = $1', [tutorialId]);
        if (existing.rows.length === 0) return NextResponse.json({ error: 'Tutorial not found' }, { status: 404 });

        const tutorial = existing.rows[0];

        if (user.role === Role.INSTRUCTOR) {
            const ownerCheck = await db.query('SELECT "createdById" FROM "Course" WHERE id = $1', [tutorial.courseId]);
            if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].createdById !== user.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        await db.query('DELETE FROM "CourseTutorial" WHERE id = $1', [tutorialId]);
        try { await removeUploadByUrl(tutorial.fileUrl); } catch { /* ignore if file already gone */ }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete tutorial' }, { status: 500 });
    }
}
