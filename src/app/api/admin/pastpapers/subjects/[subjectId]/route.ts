import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role } from '@/types';

type Params = { params: Promise<{ subjectId: string }> };

export async function PUT(req: Request, { params }: Params) {
  try {
    await getServerUser([Role.ADMIN]);
    const { subjectId } = await params;
    const body = (await req.json()) as { name?: string };
    const name = (body.name || '').trim();

    if (!name) {
      return NextResponse.json({ error: 'Subject name is required' }, { status: 400 });
    }

    const result = await db.query(
      'UPDATE "PastPaperSubject" SET name = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING id, name, "gradeId"',
      [name, subjectId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update subject:', error);
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await getServerUser([Role.ADMIN]);
    const { subjectId } = await params;

    const result = await db.query(
      'DELETE FROM "PastPaperSubject" WHERE id = $1 RETURNING id',
      [subjectId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete subject:', error);
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
  }
}
