import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth'; // The helper we created earlier

export async function GET() {
    try {
        const user = await getServerUser();
        return NextResponse.json(user);
    } catch (error) {
        console.error('Authentication error:', error);
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
}