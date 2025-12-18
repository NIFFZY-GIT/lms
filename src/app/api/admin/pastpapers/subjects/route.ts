import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role } from '@/types';

export async function GET(req: Request) {
  try {
    await getServerUser([Role.ADMIN]);
    const { searchParams } = new URL(req.url);
    const gradeId = searchParams.get('gradeId');

    if (gradeId) {
      const result = await db.query(
        'SELECT id, name, "gradeId" FROM "PastPaperSubject" WHERE "gradeId" = $1 ORDER BY name ASC',
        [gradeId]
      );
      return NextResponse.json(result.rows);
    }

    const result = await db.query('SELECT id, name, "gradeId" FROM "PastPaperSubject" ORDER BY name ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch subjects:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await getServerUser([Role.ADMIN]);
    const body = (await req.json()) as { gradeId?: string; name?: string };
    const gradeId = (body.gradeId || '').trim();
    const name = (body.name || '').trim();

    if (!gradeId) return NextResponse.json({ error: 'gradeId is required' }, { status: 400 });
    if (!name) return NextResponse.json({ error: 'Subject name is required' }, { status: 400 });

    const result = await db.query(
      'INSERT INTO "PastPaperSubject" (name, "gradeId") VALUES ($1, $2) RETURNING id, name, "gradeId"',
      [name, gradeId]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create subject:', error);
    return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
  }
}
