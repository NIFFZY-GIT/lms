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
  const { email, name, password, role } = body;

    if (!email || !name || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
    }
    const assignedRole = role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'ADMIN';

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const sql = `
      INSERT INTO "User" (id, email, name, password, role) 
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, role;
    `;
    const result = await db.query(sql, [userId, email, name, hashedPassword, assignedRole]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null) {
      const pgErr = error as { code?: string; message?: string };
      if (pgErr.code === '23505') {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
      }
      // 22P02: invalid input value for enum / data type
      // 23514: check constraint violation (e.g., role not in allowed list)
      if (pgErr.code === '22P02' || pgErr.code === '23514') {
        return NextResponse.json({
          error: 'Database does not yet allow the INSTRUCTOR role. Alter the role enum/check constraint to include INSTRUCTOR.'
        }, { status: 500 });
      }
    }
    console.error('Admin/Intructor creation error:', error);
    return NextResponse.json({ error: 'Internal server error creating user' }, { status: 500 });
  }
}