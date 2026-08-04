-- Forward migration for receipt duplicate-detection, receipt reading (OCR),
-- confirmed paid amounts, and rejection reasons.
--
--   psql -h localhost -U <user> -d <database> -f database/migrate-payment-features.sql
--
-- Additive only: it adds columns, two indexes and one foreign key. No existing
-- column, row or constraint is modified or dropped, so it cannot lose data.
-- Every statement is guarded, so running it twice is a no-op — the second run
-- prints "already exists" notices and changes nothing.
--
-- These are the same statements ensurePaymentColumns() runs automatically in
-- src/lib/receipt-duplicates.ts. Run this by hand when:
--   * you want the schema in place before the new code goes live, or
--   * the app's database user lacks ALTER TABLE rights, in which case the
--     automatic attempt logs a warning and the features stay switched off.
--     Run this file as postgres (or another superuser) instead.
--
-- Keep this list in sync with PAYMENT_COLUMNS in src/lib/receipt-duplicates.ts.
--
-- To undo:  database/rollback-receipt-detection.sql
-- To check: database/diagnose-payments.sql

BEGIN;

ALTER TABLE "Payment"
  -- Receipt-reuse detection
  ADD COLUMN IF NOT EXISTS "receiptFileHash" CHAR(64),          -- SHA-256 of the uploaded bytes
  ADD COLUMN IF NOT EXISTS "duplicateOfPaymentId" VARCHAR(36),  -- earliest payment with the same file
  ADD COLUMN IF NOT EXISTS "duplicateMatchType" VARCHAR(16),    -- 'EXACT'
  ADD COLUMN IF NOT EXISTS "receiptCheckedAt" TIMESTAMP WITH TIME ZONE,
  -- Cached read of the receipt: suggestions for the review screen, not authority
  ADD COLUMN IF NOT EXISTS "ocrReference" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "ocrAmount" NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS "ocrText" TEXT,
  ADD COLUMN IF NOT EXISTS "ocrSource" VARCHAR(16),             -- 'PDF_TEXT' or 'IMAGE_OCR'
  ADD COLUMN IF NOT EXISTS "ocrConfidence" SMALLINT,            -- 0-100; NULL for PDF text
  ADD COLUMN IF NOT EXISTS "ocrScannedAt" TIMESTAMP WITH TIME ZONE,
  -- Admin review
  ADD COLUMN IF NOT EXISTS "paidAmount" NUMERIC(12, 2),         -- amount confirmed at approval
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;              -- shown verbatim to the student

-- Duplicate lookup hashes every new upload against these.
CREATE INDEX IF NOT EXISTS idx_payment_receipt_file_hash ON "Payment"("receiptFileHash");
CREATE INDEX IF NOT EXISTS idx_payment_duplicate_of ON "Payment"("duplicateOfPaymentId");

-- ON DELETE SET NULL so deleting the matched payment clears the link instead of
-- blocking the delete. ADD CONSTRAINT has no IF NOT EXISTS, hence the catch.
DO $$ BEGIN
  ALTER TABLE "Payment"
    ADD CONSTRAINT payment_duplicate_of_fkey
    FOREIGN KEY ("duplicateOfPaymentId") REFERENCES "Payment"(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;

-- Expect "12 of 12". Anything less means the ALTER above did not apply — check
-- for a permissions error in the output.
SELECT count(*) || ' of 12 payment feature columns present' AS status
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name = 'Payment'
   AND column_name IN (
       'receiptFileHash', 'duplicateOfPaymentId', 'duplicateMatchType', 'receiptCheckedAt',
       'ocrReference', 'ocrAmount', 'ocrText', 'ocrSource', 'ocrConfidence', 'ocrScannedAt',
       'paidAmount', 'rejectionReason'
   );
