import { NextResponse } from 'next/server';
import { fetchPastPapersTree } from '@/lib/pastpapers';

export async function GET() {
  try {
    const payload = await fetchPastPapersTree();
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Failed to fetch past papers:', error);
    return NextResponse.json({ error: 'Failed to fetch past papers' }, { status: 500 });
  }
}
