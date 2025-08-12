import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as bcrypt from 'bcrypt';
import { clearResetCode, getResetCode } from '@/lib/resetStore';

export async function POST(req: Request) {
  try {
    const { email, phone, code, newPassword } = await req.json();
    if ((!email && !phone) || !code || !newPassword) {
      return NextResponse.json({ error: 'Email/phone, code, and new password are required' }, { status: 400 });
    }

    const where = email ? 'email = $1' : 'phone = $1';
    const value = email ?? phone;
    const result = await db.query(`SELECT id FROM "User" WHERE ${where}`, [value]);

    if (result.rows.length === 0) {
      // Generic response to avoid user enumeration
      return NextResponse.json({ error: 'Invalid code or expired' }, { status: 400 });
    }

    const user = result.rows[0] as { id: string };
    const record = getResetCode(user.id);
    if (!record || record.code !== code || Date.now() > record.expiresAt) {
      return NextResponse.json({ error: 'Invalid code or expired' }, { status: 400 });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE "User" SET password = $1 WHERE id = $2', [hash, user.id]);

    clearResetCode(user.id);
    return NextResponse.json({ message: 'Password has been reset' });
  } catch {
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
