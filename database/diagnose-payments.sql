-- Diagnostic for "the admin payments page shows no receipts".
--
-- READ-ONLY. This file only runs SELECTs — it changes nothing and is safe to
-- run on production at any time.
--
--   psql -h localhost -U <user> -d <database> -f database/diagnose-payments.sql
--
-- What each section tells you is written above it.

\echo ''
\echo '=== 1. Are the receipts still in the database? ==============================='
\echo '(If these counts look right, nothing was lost — it is a display problem.)'

SELECT status, count(*) AS payments, count("receiptUrl") AS "withReceipt"
  FROM "Payment"
 GROUP BY status
 ORDER BY status;

\echo ''
\echo '=== 2. The 20 most recent payments ==========================================='
\echo '(Check whether the "missing" ones are simply APPROVED — the page opens on'
\echo ' the Pending tab, which hides them.)'

SELECT p.id, u.email AS student, c.title AS course, p.status,
       p."createdAt"::date AS submitted,
       CASE WHEN p."receiptUrl" IS NULL THEN 'NO FILE' ELSE 'ok' END AS receipt
  FROM "Payment" p
  JOIN "User" u ON p."studentId" = u.id
  JOIN "Course" c ON p."courseId" = c.id
 ORDER BY p."createdAt" DESC
 LIMIT 20;

\echo ''
\echo '=== 3. Does "Course".price exist? ============================================'
\echo '(The payments list selects c.price. A production database that predates it'
\echo ' makes the whole query fail, which renders an empty table.)'

SELECT CASE WHEN count(*) = 1 THEN 'OK - Course.price exists'
            ELSE 'MISSING - Course.price does not exist (this breaks the list)'
       END AS "Course.price"
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'Course' AND column_name = 'price';

\echo ''
\echo '=== 4. How many receipt-feature columns are installed? ======================='
\echo '(Expect 12 of 12. Anything less and the duplicate/OCR features stay off —'
\echo ' which is safe, the list still works. Run migrate-payment-features.sql to fix.)'

SELECT count(*) || ' of 12 receipt feature columns present' AS status
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name = 'Payment'
   AND column_name IN (
       'receiptFileHash', 'duplicateOfPaymentId', 'duplicateMatchType', 'receiptCheckedAt',
       'ocrReference', 'ocrAmount', 'ocrText', 'ocrSource', 'ocrConfidence', 'ocrScannedAt',
       'paidAmount', 'rejectionReason'
   );

\echo ''
\echo '=== 5. Which of them are missing, individually? =============================='

SELECT expected.column_name AS "missing column"
  FROM unnest(ARRAY[
       'receiptFileHash', 'duplicateOfPaymentId', 'duplicateMatchType', 'receiptCheckedAt',
       'ocrReference', 'ocrAmount', 'ocrText', 'ocrSource', 'ocrConfidence', 'ocrScannedAt',
       'paidAmount', 'rejectionReason'
  ]) AS expected(column_name)
 WHERE NOT EXISTS (
       SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = 'Payment'
          AND c.column_name = expected.column_name
 );

\echo ''
\echo '(No rows above section 5 = nothing missing.)'
\echo ''
