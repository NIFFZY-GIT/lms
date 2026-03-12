import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getServerUser();
    return NextResponse.json(user);
  } catch {
    // Return 200 null so client-side auth checks don't produce 401 console noise
    return NextResponse.json(null);
  }
}