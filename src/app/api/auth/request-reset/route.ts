import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { setResetCode } from '@/lib/resetStore';
import { sendResetEmail } from '@/lib/notify';

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await db.query(`SELECT id, email FROM "User" WHERE email = $1`, [email]);

    if (result.rows.length > 0) {
      const user = result.rows[0] as { id: string; email: string };
      const code = generateCode();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      setResetCode(user.id, { code, expiresAt });

      try {
        await sendResetEmail(user.email, code);
      } catch {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Reset email delivery failed');
          console.info('DEV ONLY: reset code =', code);
        }
      }
    }

    // Always respond the same for privacy
    return NextResponse.json({ message: 'If an account exists, a reset code was sent.' });
  } catch {
    return NextResponse.json({ error: 'Failed to request password reset' }, { status: 500 });
  }
}
