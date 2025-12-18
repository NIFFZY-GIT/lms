import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role } from '@/types';
import { PDF_25MB, assertFile } from '@/lib/security';
import { saveUploadFile } from '@/lib/uploads';
import type { PoolClient } from 'pg';

function toTitleFromFileName(name: string) {
  const base = name.replace(/\.[^/.]+$/, '');
  return base.replace(/[_-]+/g, ' ').trim() || 'Past Paper';
}

export async function POST(req: Request) {
  let client: PoolClient | undefined;

  try {
    const user = await getServerUser([Role.ADMIN]);
    const formData = await req.formData();

    const subjectId = String(formData.get('subjectId') || '').trim();
    const medium = String(formData.get('medium') || '').trim();
    const term = String(formData.get('term') || '').trim();
    const yearRaw = String(formData.get('year') || '').trim();
    const year = Number(yearRaw);

    if (!subjectId) return NextResponse.json({ error: 'subjectId is required' }, { status: 400 });
    if (!medium) return NextResponse.json({ error: 'medium is required' }, { status: 400 });
    if (!term) return NextResponse.json({ error: 'term is required' }, { status: 400 });
    if (!Number.isFinite(year) || year < 1900 || year > 2100) {
      return NextResponse.json({ error: 'year must be a valid year' }, { status: 400 });
    }

    const files = formData.getAll('files') as unknown[];
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'At least one file is required' }, { status: 400 });
    }

    client = await db.connect();
    await client.query('BEGIN');

    const created: Array<{ id: string; title: string; medium: string; term: string; year: number; fileUrl: string }> = [];

    for (const f of files) {
      const file = f as File;
      try {
        assertFile(file, PDF_25MB, 'past paper');
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Invalid file';
        await client.query('ROLLBACK');
        return NextResponse.json({ error: msg }, { status: 400 });
      }

      const { publicPath } = await saveUploadFile(file, 'pastpapers');
      const title = toTitleFromFileName(file.name || 'past-paper.pdf');

      const insertSql = `
        INSERT INTO "PastPaper" (title, medium, term, year, "fileUrl", "subjectId", "createdById")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, title, medium, term, year, "fileUrl";
      `;

      const result = await client.query(insertSql, [title, medium, term, year, publicPath, subjectId, user.id]);
      const row = result.rows[0];
      created.push({ id: row.id, title: row.title, medium: row.medium, term: row.term, year: row.year, fileUrl: row.fileUrl });
    }

    await client.query('COMMIT');
    return NextResponse.json({ created }, { status: 201 });
  } catch (error) {
    console.error('Failed to upload past papers:', error);
    try {
      await client?.query('ROLLBACK');
    } catch {
      // ignore
    }
    return NextResponse.json({ error: 'Failed to upload past papers' }, { status: 500 });
  } finally {
    client?.release();
  }
}
