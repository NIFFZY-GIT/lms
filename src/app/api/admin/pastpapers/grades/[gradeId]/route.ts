import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role } from '@/types';

type Params = { params: Promise<{ gradeId: string }> };

export async function PUT(req: Request, { params }: Params) {
  try {
    await getServerUser([Role.ADMIN]);
    const { gradeId } = await params;
    const body = (await req.json()) as { name?: string };
    const name = (body.name || '').trim();

    if (!name) {
      return NextResponse.json({ error: 'Grade name is required' }, { status: 400 });
    }

    const result = await db.query(
      'UPDATE "PastPaperGrade" SET name = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING id, name',
      [name, gradeId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Grade not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update grade:', error);
    return NextResponse.json({ error: 'Failed to update grade' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await getServerUser([Role.ADMIN]);
    const { gradeId } = await params;

    const result = await db.query(
      'DELETE FROM "PastPaperGrade" WHERE id = $1 RETURNING id',
      [gradeId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Grade not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete grade:', error);
    return NextResponse.json({ error: 'Failed to delete grade' }, { status: 500 });
  }
}
