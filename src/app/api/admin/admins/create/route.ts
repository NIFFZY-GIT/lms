import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role } from '@/types';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    await getServerUser(Role.ADMIN); // Only an existing admin can create a new one
    const body = await req.json();
    const { email, name, password } = body;

    if (!email || !name || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const sql = `
      INSERT INTO "User" (id, email, name, password, role) 
      VALUES ($1, $2, $3, $4, 'ADMIN')
      RETURNING id, email, name, role;
    `;
    const result = await db.query(sql, [userId, email, name, hashedPassword]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }
    console.error('Admin creation error:', error);
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
  }
}