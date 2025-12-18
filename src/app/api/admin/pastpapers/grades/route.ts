import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role } from '@/types';

export async function GET() {
  try {
    await getServerUser([Role.ADMIN]);
    const result = await db.query('SELECT id, name FROM "PastPaperGrade" ORDER BY name ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch grades:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await getServerUser([Role.ADMIN]);
    const body = (await req.json()) as { name?: string };
    const name = (body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Grade name is required' }, { status: 400 });

    const result = await db.query(
      'INSERT INTO "PastPaperGrade" (name) VALUES ($1) RETURNING id, name',
      [name]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create grade:', error);
    return NextResponse.json({ error: 'Failed to create grade' }, { status: 500 });
  }
}
