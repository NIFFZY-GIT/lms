import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role } from '@/types';
import { sendEnrollmentStatusToStaff, sendPaymentRejectedEmail } from '@/lib/notify';
import { ensurePaymentColumns, hasPaymentColumn } from '@/lib/receipt-duplicates';

const MAX_REASON_LENGTH = 500;

export async function PATCH(req: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  try {
    await getServerUser(Role.ADMIN);
    await ensurePaymentColumns();
    const { paymentId } = await params;

    // The reason is shown to the student on the course page and in their email,
    // so it is required — "rejected, no explanation" just generates support
    // messages and a re-upload of the same receipt.
    const body = await req.json().catch(() => ({}));
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';

    if (!reason) {
      return NextResponse.json(
        { error: 'A reason is required so the student knows what to fix.' },
        { status: 400 }
      );
    }
    if (reason.length > MAX_REASON_LENGTH) {
      return NextResponse.json(
        { error: `Keep the reason under ${MAX_REASON_LENGTH} characters.` },
        { status: 400 }
      );
    }

    // Where the column is missing the reason still reaches the student by
    // email; only the copy shown on their course page is lost. Failing the
    // rejection outright over it would be far worse.
    const withReason = await hasPaymentColumn('rejectionReason');

    const sql = withReason
      ? `
      UPDATE "Payment"
      SET status = 'REJECTED', "rejectionReason" = $2, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'PENDING' RETURNING *;
    `
      : `
      UPDATE "Payment"
      SET status = 'REJECTED', "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'PENDING' RETURNING *;
    `;
    const result = await db.query(sql, withReason ? [paymentId, reason] : [paymentId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found or already processed' }, { status: 404 });
    }

    const detailResult = await db.query<{
      studentEmail: string;
      studentName: string;
      courseTitle: string;
      createdById: string;
    }>(
      `
      SELECT
        u.email AS "studentEmail",
        COALESCE(u.name, 'there') AS "studentName",
        c.title AS "courseTitle",
        c."createdById" AS "createdById"
      FROM "Payment" p
      JOIN "User" u ON p."studentId" = u.id
      JOIN "Course" c ON p."courseId" = c.id
      WHERE p.id = $1
      LIMIT 1
      `,
      [paymentId]
    );

    const details = detailResult.rows[0];
    if (details) {
      try {
        await sendPaymentRejectedEmail(details.studentEmail, {
          name: details.studentName,
          courseTitle: details.courseTitle,
          reason,
        });

        const staffResult = await db.query<{ email: string | null }>(
          `
          SELECT DISTINCT email
          FROM "User"
          WHERE email IS NOT NULL
            AND (role = ANY($1) OR id = $2)
          `,
          [[Role.ADMIN, Role.INSTRUCTOR], details.createdById]
        );
        const staffEmails = staffResult.rows
          .map((row) => row.email)
          .filter((email): email is string => Boolean(email));

        await sendEnrollmentStatusToStaff(staffEmails, {
          studentName: details.studentName,
          studentEmail: details.studentEmail,
          courseTitle: details.courseTitle,
          status: 'REJECTED',
        });
      } catch (emailError) {
        console.error('Payment rejection email failed:', emailError);
      }
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Payment rejection error:", error);
    return NextResponse.json({ error: 'Failed to reject payment' }, { status: 500 });
  }
}