import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { getServerUser } from '../../../../../lib/auth';
import { Role } from '../../../../../types';
import { sendPaymentApprovedEmail } from '../../../../../lib/notify';

interface PostgresError { code?: string; }

export async function PATCH(req: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  let referenceNumber: string | undefined;
  try {
    await getServerUser(Role.ADMIN);
    const { paymentId } = await params;
    const body = await req.json();
    referenceNumber = body.referenceNumber;

    if (!referenceNumber || referenceNumber.trim() === '') {
      return NextResponse.json({ error: 'A reference number is required for approval.' }, { status: 400 });
    }

    const sanitizedRef = referenceNumber.trim();
    const sql = `
      UPDATE "Payment"
      SET 
        status = 'APPROVED', 
        "referenceNumber" = $1, 
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE 
        id = $2 AND status = 'PENDING'
      RETURNING *;
    `;
    const result = await db.query(sql, [sanitizedRef, paymentId]);

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