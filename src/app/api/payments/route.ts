import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getServerUser } from '../../../lib/auth';
import { Role } from '../../../types';
import {
  ensurePaymentColumns,
  hasPaymentColumns,
} from '@/lib/receipt-duplicates';

export async function GET() {
  try {
    await getServerUser(Role.ADMIN);
    await ensurePaymentColumns();

    // If the DB user could not add the columns, fall back to the plain list
    // rather than failing the whole page.
    const withDuplicates = await hasPaymentColumns();

    const duplicateColumns = withDuplicates
      ? `,
        -- Only report a match while the matched payment still exists; deleting it
        -- nulls the FK but leaves duplicateMatchType behind.
        CASE WHEN dup.id IS NOT NULL THEN p."duplicateMatchType" END as "duplicateMatchType",
        p."duplicateOfPaymentId",
        p."ocrReference",
        p."ocrAmount",
        p."ocrSource",
        p."ocrConfidence",
        p."ocrScannedAt",
        p."rejectionReason",
        dup."receiptUrl" as "duplicateReceiptUrl",
        dup."createdAt" as "duplicateCreatedAt",
        dup.status as "duplicateStatus",
        dupUser.name as "duplicateStudentName",
        dupUser.email as "duplicateStudentEmail",
        dupCourse.title as "duplicateCourseTitle"`
      : '';

    const duplicateJoins = withDuplicates
      ? `
      LEFT JOIN "Payment" dup ON p."duplicateOfPaymentId" = dup.id
      LEFT JOIN "User" dupUser ON dup."studentId" = dupUser.id
      LEFT JOIN "Course" dupCourse ON dup."courseId" = dupCourse.id`
      : '';

    const sql = `
      SELECT
        p.id,
        p.status,
        p."receiptUrl",
        p."createdAt",
        p."subscriptionExpiryDate",
        p."studentId",
        u.name as "studentName",
        c.title as "courseTitle",
        c.id as "courseId",
        c."courseType",
        c.price as "coursePrice"${duplicateColumns}
      FROM "Payment" p
      JOIN "User" u ON p."studentId" = u.id
      JOIN "Course" c ON p."courseId" = c.id${duplicateJoins}
      ORDER BY p.status ASC, p."createdAt" DESC;
    `;
    const result = await db.query(sql);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Fetch payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
