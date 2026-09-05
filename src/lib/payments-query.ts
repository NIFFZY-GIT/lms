/**
 * SQL for the admin payment list.
 *
 * The payment list is the only place an admin can see and approve receipts, so
 * it has to render even when the newer columns are unavailable — a production
 * database that has drifted from database/schema.sql must not be able to blank
 * the page. The caller tries these tiers in order, most specific first:
 *
 *   1. { withDuplicates: true,  withPrice: true }  — needs the feature migration
 *   2. { withDuplicates: false, withPrice: true }  — needs "Course".price
 *   3. { withDuplicates: false, withPrice: false } — the original list
 *
 * Tier 3 is deliberately the exact query that ran in production before any of
 * this feature existed, so it is the one that cannot fail for a missing column.
 *
 * Kept out of the route file because Next.js route modules may only export HTTP
 * handlers, and this needs to be importable on its own to be tested.
 */
export function buildPaymentsSql({
  withDuplicates,
  withPrice,
}: {
  withDuplicates: boolean;
  withPrice: boolean;
}): string {
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

  // Only used to flag an amount mismatch at review time; the list itself works
  // without it.
  const priceColumn = withPrice
    ? `,
        c.price as "coursePrice"`
    : '';

  return `
      SELECT
        p.id,
        p.status,
        p."receiptUrl",
        p."createdAt",
        p."subscriptionExpiryDate",
        p."studentId",
        u.name as "studentName",
        u.email as "studentEmail",
        u.phone as "studentPhone",
        c.title as "courseTitle",
        c.id as "courseId",
        c."courseType"${priceColumn}${duplicateColumns}
      FROM "Payment" p
      JOIN "User" u ON p."studentId" = u.id
      JOIN "Course" c ON p."courseId" = c.id${duplicateJoins}
      ORDER BY p.status ASC, p."createdAt" DESC;
    `;
}
