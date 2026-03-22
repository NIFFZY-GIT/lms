import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role } from '@/types';
import { sendEnrollmentStatusToStaff, sendPaymentRejectedEmail } from '@/lib/notify';

export async function PATCH(req: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  try {
    await getServerUser(Role.ADMIN);
    const { paymentId } = await params;

    const sql = `
      UPDATE "Payment"
      SET status = 'REJECTED', "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'PENDING' RETURNING *;
    `;
    const result = await db.query(sql, [paymentId]);

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