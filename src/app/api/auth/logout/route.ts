import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // To delete a cookie, you set it again with a maxAge of 0 or an expiry date in the past.
    const cookieStore = await cookies();
    cookieStore.set('token', '', { 
      httpOnly: true, 
      maxAge: 0, 
      path: '/' // The path must match the path of the cookie you set on login!
    });
    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to log out' }, { status: 500 });
  }
}