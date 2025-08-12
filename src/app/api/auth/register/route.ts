import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, password, address, phone } = body as {
      email?: string; name?: string; password?: string; address?: string; phone?: string;
    };

    // Validate required fields
    if (!name || !email || !password || !address || !phone) {
      return NextResponse.json({ error: 'Name, email, phone, address, and password are required.' }, { status: 400 });
    }

    // Check if email already exists (friendly early check)
    const exists = await db.query('SELECT 1 FROM "User" WHERE email = $1 LIMIT 1', [email]);
    if (exists.rowCount && exists.rowCount > 0) {
      return NextResponse.json({ error: 'This email is already registered' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    const sql = `
      INSERT INTO "User" (id, email, name, password, address, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, name;
    `;
    const result = await db.query(sql, [userId, email, name, hashedPassword, address, phone]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: unknown) {
    // Fallback if unique constraint triggers
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: 'This email is already registered' }, { status: 409 });
    }
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
  }
}