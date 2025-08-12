// src/app/api/auth/login/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email: string | undefined = body?.email;
    const phone: string | undefined = body?.phone;
    const password: string | undefined = body?.password;

    if ((!email && !phone) || !password) {
      return NextResponse.json({ error: 'Email/phone and password are required' }, { status: 400 });
    }

    const where = email ? 'email = $1' : 'phone = $1';
    const value = email ?? phone;

    const userQuery = `SELECT * FROM "User" WHERE ${where}`;
    const userResult = await db.query(userQuery, [value]);

    if (userResult.rows.length === 0) {
      // Keep generic to avoid user enumeration
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = userResult.rows[0];

    const isPasswordValid = await bcrypt.compare(password!, user.password);
    if (!isPasswordValid) {
      // Keep generic but use 401
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });

    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch {
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
  }
}