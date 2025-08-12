import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getServerUser();
    return NextResponse.json(user);
  } catch {
    // Return a quiet 401 without logging stack traces in dev
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
}