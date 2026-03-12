import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { getServerUser } from '../../../../../lib/auth';
import { Role } from '../../../../../types';
import { addWeeks } from 'date-fns';

function getSubscriptionExpiryDate(currentExpiry: Date | null): Date {
  const now = new Date();
  const baseDate = currentExpiry && currentExpiry > now ? currentExpiry : now;
  return addWeeks(baseDate, 1);
}

/**
 * PATCH /api/payments/[paymentId]/force-extend
 * Admin-only: Force-extend a subscription payment's expiry by one week.
 * Body: { force?: boolean }  - pass force:true to override an existing active subscription conflict
 */
export async function PATCH(req: Request, props: { params: Promise<{ paymentId: string }> }) {
  try {
    await getServerUser(Role.ADMIN);
    const resolvedParams = await props.params;
    const paymentId: string = resolvedParams.paymentId;
    const body = await req.json().catch(() => ({}));
    const force: boolean = body.force === true;

    // --- Fetch the target payment alongside its course type ---
    const paymentResult = await db.query<{
      id: string;
      studentId: string;
      courseId: string;
      courseType: string;
      status: string;
      subscriptionExpiryDate: Date | null;
    }>(
      `SELECT p.id, p."studentId", p."courseId", p.status, p."subscriptionExpiryDate",
              c."courseType"
       FROM "Payment" p
       JOIN "Course" c ON p."courseId" = c.id
       WHERE p.id = $1`,
      [paymentId]
    );

    if (paymentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
    }

    const payment = paymentResult.rows[0];

    if (payment.courseType !== 'SUBSCRIPTION') {
      return NextResponse.json({ error: 'Force-extend is only available for subscription courses.' }, { status: 400 });
    }

    const newExpiry = getSubscriptionExpiryDate(payment.subscriptionExpiryDate);

    // --- Conflict check: is there ANOTHER approved active subscription for the same student+course? ---
    const conflictResult = await db.query<{ id: string; subscriptionExpiryDate: Date }>(
      `SELECT id, "subscriptionExpiryDate"
       FROM "Payment"
       WHERE "studentId" = $1
         AND "courseId" = $2
         AND status = 'APPROVED'
         AND "subscriptionExpiryDate" > CURRENT_TIMESTAMP
         AND id != $3`,
      [payment.studentId, payment.courseId, paymentId]
    );

    if (conflictResult.rows.length > 0 && !force) {
      const existing = conflictResult.rows[0];
      return NextResponse.json({
        error: 'Conflict: this student already has an active subscription for this course.',
        conflictPaymentId: existing.id,
        conflictExpiry: existing.subscriptionExpiryDate,
        requiresForce: true,
      }, { status: 409 });
    }

    // --- Perform the extension ---
    const updateResult = await db.query(
      `UPDATE "Payment"
       SET status = 'APPROVED',
           "subscriptionExpiryDate" = $1,
           "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *;`,
      [newExpiry, paymentId]
    );

    return NextResponse.json({
      message: 'Subscription successfully extended by one week.',
      payment: updateResult.rows[0],
    });
  } catch (error) {
    console.error('Force-extend subscription error:', error);
    return NextResponse.json({ error: 'Failed to extend subscription.' }, { status: 500 });
  }
}
