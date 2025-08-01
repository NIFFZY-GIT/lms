// src/app/api/auth/register/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const { email, name, password } = await req.json();

    if (!email || !name || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const sqlQuery = `
      INSERT INTO "User" (id, email, name, password) 
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, name, role;
    `;
    const values = [userId, email, name, hashedPassword];

    const result = await db.query(sqlQuery, values);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) { // The 'any' type is removed here
    // Check if error is an object and has a 'code' property
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
  }
}