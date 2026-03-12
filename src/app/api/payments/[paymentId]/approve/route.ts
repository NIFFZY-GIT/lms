import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { getServerUser } from '../../../../../lib/auth';
import { Role } from '../../../../../types';
import { sendPaymentApprovedEmail } from '../../../../../lib/notify';
import { lastDayOfMonth } from 'date-fns';

interface PostgresError { code?: string; }

// Helper: Get the last day of the current month (end of day)
function getSubscriptionExpiryDate(): Date {
  const now = new Date();
  const endOfMonth = lastDayOfMonth(now);
  endOfMonth.setHours(23, 59, 59, 999);
  return endOfMonth;
}

export async function PATCH(req: Request, props: { params: Promise<{ paymentId: string }> }) {
  let referenceNumber: string | undefined;
  try {
    await getServerUser(Role.ADMIN);
    const resolvedParams = await props.params;
    const paymentId: string = resolvedParams.paymentId;
    const body = await req.json();
    referenceNumber = body.referenceNumber;

    if (!referenceNumber || referenceNumber.trim() === '') {
      return NextResponse.json({ error: 'A reference number is required for approval.' }, { status: 400 });
    }

    const sanitizedRef = referenceNumber.trim();

    // First, get the course type for this payment
    const courseCheckSql = `
      SELECT p."courseId", c."courseType"
      FROM "Payment" p
      JOIN "Course" c ON p."courseId" = c.id
      WHERE p.id = $1;
    `;
    const courseCheckResult = await db.query<{ courseId: string; courseType: string }>(courseCheckSql, [paymentId]);
    
    if (courseCheckResult.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const isSubscription = courseCheckResult.rows[0].courseType === 'SUBSCRIPTION';
    const subscriptionExpiryDate = isSubscription ? getSubscriptionExpiryDate() : null;

    const sql = isSubscription
      ? `UPDATE "Payment"
         SET 
           status = 'APPROVED', 
           "referenceNumber" = $1,
           "subscriptionExpiryDate" = $3,
           "updatedAt" = CURRENT_TIMESTAMP
         WHERE 
           id = $2 AND status = 'PENDING'
         RETURNING *;`
      : `UPDATE "Payment"
         SET 
           status = 'APPROVED', 
           "referenceNumber" = $1,
           "updatedAt" = CURRENT_TIMESTAMP
         WHERE 
           id = $2 AND status = 'PENDING'
         RETURNING *;`;

    const params = isSubscription ? [sanitizedRef, paymentId, subscriptionExpiryDate] : [sanitizedRef, paymentId];
    const result = await db.query(sql, params);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found or already processed' }, { status: 404 });
    }
    const payment = result.rows[0] as { studentId: string; courseId: string; referenceNumber: string };

    const detailSql = `
      SELECT 
        u.email AS "studentEmail",
        COALESCE(u.name, 'there') AS "studentName",
        c.title AS "courseTitle"
      FROM "Payment" p
      JOIN "User" u ON p."studentId" = u.id
      JOIN "Course" c ON p."courseId" = c.id
      WHERE p.id = $1
      LIMIT 1;
    `;

    const detailResult = await db.query(detailSql, [paymentId]);
    const details = detailResult.rows[0] as { studentEmail: string; studentName: string; courseTitle: string } | undefined;

    if (details) {
      try {
        await sendPaymentApprovedEmail(details.studentEmail, details.studentName, details.courseTitle, payment.referenceNumber);
      } catch (emailError) {
        console.error('Payment approval email failed:', emailError);
      }
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error: unknown) {
    const pgError = error as PostgresError;
    if (pgError?.code === '23505') { // unique_violation
      return NextResponse.json({ error: `This reference number (${referenceNumber}) has already been used.` }, { status: 409 });
    }
    console.error("Approve payment error:", error);
    return NextResponse.json({ error: 'Failed to approve payment' }, { status: 500 });
  }
}