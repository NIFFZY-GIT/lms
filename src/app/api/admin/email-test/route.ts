import { NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';
import { Role } from '@/types';
import { verifyEmailConnection, sendTestEmail } from '@/lib/notify';

/**
 * GET /api/admin/email-test
 * Verify email configuration (Admin only)
 */
export async function GET() {
  try {
    await getServerUser(Role.ADMIN);
    
    const result = await verifyEmailConnection();
    
    if (result.success) {
      return NextResponse.json({ 
        message: 'SMTP connection verified successfully',
        success: true 
      });
    } else {
      return NextResponse.json({ 
        error: result.error || 'SMTP connection failed',
        success: false 
      }, { status: 500 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify email configuration';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/email-test
 * Send a test email to the specified address (Admin only)
 * Body: { email: string }
 */
export async function POST(req: Request) {
  try {
    await getServerUser(Role.ADMIN);
    
    const { email } = await req.json();
    
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 });
    }

    const result = await sendTestEmail(email);
    
    if (result.success) {
      return NextResponse.json({ 
        message: `Test email sent successfully to ${email}`,
        success: true 
      });
    } else {
      return NextResponse.json({ 
        error: result.error || 'Failed to send test email',
        success: false 
      }, { status: 500 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send test email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
