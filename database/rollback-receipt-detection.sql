-- Rollback for the receipt duplicate-detection and OCR feature.
--
-- Removes every column the feature added to "Payment". Nothing else in the
-- schema is touched: the original Payment columns and all existing rows are
-- untouched by both the migration and this rollback.
--
-- Dropping a column automatically drops the indexes and foreign keys that
-- depend on it, so idx_payment_receipt_file_hash, idx_payment_duplicate_of and
-- payment_duplicate_of_fkey do not need separate DROP statements.
--
--   psql -h localhost -U <user> -d <database> -f database/rollback-receipt-detection.sql
--
-- ⚠ This discards the fingerprints, cached receipt reads, and any confirmed
--   paid amounts. Re-running the feature rebuilds fingerprints and re-reads
--   receipts, but "paidAmount" values entered by an admin are gone for good.
--   Take a backup first:  pg_dump -h localhost -U <user> <database> > backup.sql
--
-- ⚠ The app re-creates these columns automatically the next time an admin
--   opens the payments page (see ensureReceiptFingerprintColumns in
--   src/lib/receipt-duplicates.ts). To roll back for real, deploy the previous
--   version of the code as well, or this rollback will simply be undone.

BEGIN;

ALTER TABLE "Payment"
  DROP COLUMN IF EXISTS "receiptFileHash",
  DROP COLUMN IF EXISTS "duplicateOfPaymentId",
  DROP COLUMN IF EXISTS "duplicateMatchType",
  DROP COLUMN IF EXISTS "receiptCheckedAt",
  DROP COLUMN IF EXISTS "ocrReference",
  DROP COLUMN IF EXISTS "ocrAmount",
  DROP COLUMN IF EXISTS "ocrText",
  DROP COLUMN IF EXISTS "ocrSource",
  DROP COLUMN IF EXISTS "ocrConfidence",
  DROP COLUMN IF EXISTS "ocrScannedAt",
  DROP COLUMN IF EXISTS "paidAmount",
  DROP COLUMN IF EXISTS "rejectionReason";

COMMIT;
