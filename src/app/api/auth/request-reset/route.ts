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
    console.log(`🔍 Looking up user with email: ${email}`);
    console.log(`   Found ${result.rows.length} user(s)`);

    let devCode: string | undefined;

    if (result.rows.length > 0) {
      const user = result.rows[0] as { id: string; email: string };
      const code = generateCode();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      setResetCode(user.id, { code, expiresAt });

      try {
        console.log(`Attempting to send reset email to ${user.email} with code ${code}...`);
        console.log(`SMTP Config: host=${process.env.SMTP_HOST}, port=${process.env.SMTP_PORT}, user=${process.env.SMTP_USER}, from=${process.env.SMTP_FROM}`);
        await sendResetEmail(user.email, code);
        console.log(`✅ Reset email sent successfully to ${user.email}`);
      } catch (emailError) {
        const errorMsg = emailError instanceof Error ? emailError.message : 'Unknown error';
        const errorStack = emailError instanceof Error ? emailError.stack : '';
        console.error('❌ Reset email delivery failed:', errorMsg);
        console.error('Stack trace:', errorStack);
        
        if (process.env.NODE_ENV !== 'production') {
          console.info('DEV ONLY: reset code =', code);
          devCode = code; // Include in response for development
        }
      }
    }

    // In development, include the code in response if email failed
    if (process.env.NODE_ENV !== 'production' && devCode) {
      return NextResponse.json({ 
        message: 'If an account exists, a reset code was sent.',
        devNote: 'Email delivery failed. Use this code for testing.',
        devCode 
      });
    }

    // Always respond the same for privacy
    return NextResponse.json({ message: 'If an account exists, a reset code was sent.' });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ error: 'Failed to request password reset' }, { status: 500 });
  }
}
