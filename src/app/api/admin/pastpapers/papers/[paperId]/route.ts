import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role } from '@/types';

type Params = { params: Promise<{ paperId: string }> };

export async function PUT(req: Request, { params }: Params) {
  try {
    await getServerUser([Role.ADMIN]);
    const { paperId } = await params;
    const body = (await req.json()) as { title?: string; term?: string; medium?: string; year?: number };

    const title = (body.title || '').trim();
    const term = (body.term || '').trim();
    const medium = (body.medium || '').trim();
    const year = body.year;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!term) {
      return NextResponse.json({ error: 'Term is required' }, { status: 400 });
    }
    if (!medium) {
      return NextResponse.json({ error: 'Medium is required' }, { status: 400 });
    }
    if (!year || year < 1900 || year > 2100) {
      return NextResponse.json({ error: 'Valid year is required' }, { status: 400 });
    }

    const result = await db.query(
      `UPDATE "PastPaper" 
       SET title = $1, term = $2, medium = $3, year = $4, "updatedAt" = NOW() 
       WHERE id = $5 
       RETURNING id, title, term, medium, year, "fileUrl"`,
      [title, term, medium, year, paperId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update paper:', error);
    return NextResponse.json({ error: 'Failed to update paper' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await getServerUser([Role.ADMIN]);
    const { paperId } = await params;

    const result = await db.query(
      'DELETE FROM "PastPaper" WHERE id = $1 RETURNING id, "fileUrl"',
      [paperId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    // Note: You may want to delete the actual file from storage here
    // const fileUrl = result.rows[0].fileUrl;
    // await deleteFile(fileUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete paper:', error);
    return NextResponse.json({ error: 'Failed to delete paper' }, { status: 500 });
  }
}
