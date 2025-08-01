// src/app/api/auth/login/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    console.log('--- LOGIN ATTEMPT ---');
    console.log('Attempting login for email:', email);
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // 1. Find the user in the database
    const userQuery = `SELECT * FROM "User" WHERE email = $1`;
    const userResult = await db.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      console.log('User not found in database.');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = userResult.rows[0];
    console.log('User found:', { id: user.id, email: user.email });
    console.log('Hashed password from DB:', user.password);
    console.log('Password from login form:', password);
    
    // 2. Compare the provided password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('bcrypt.compare result:', isPasswordValid); // <-- THIS IS THE MOST IMPORTANT LOG

    if (!isPasswordValid) {
      console.log('Password comparison failed.');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    // --- If we reach here, the password is correct ---
    console.log('Login successful! Creating JWT.');

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });

    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    // Don't send the password hash back to the client
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('--- LOGIN API ERROR ---', error);
    return NextResponse.json({ error: 'Something went wrong on the server' }, { status: 500 });
  }
}