import 'server-only';

import crypto from 'crypto';
import { readFile } from 'fs/promises';
import { db } from '@/lib/db';
import { resolveUploadDiskPath } from '@/lib/uploads';

/**
 * Receipt-reuse detection.
 *
 * Only exact (byte-identical) matching is used. Perceptual/"looks similar"
 * image hashing was tried and rejected: bank slips share a fixed template, so a
 * downscaled hash reads the layout rather than the reference number. Measured on
 * synthetic Sampath-style slips at 256 -> 16384 bits, two *different* payments
 * scored a Hamming distance of 0-8 while the *same* receipt re-photographed
 * scored 35-2240 — the ordering is inverted, so no threshold separates them.
 *
 * Catching a re-photographed receipt requires reading the reference number off
 * the image (OCR) and checking it against Payment."referenceNumber", which is
 * the existing manual admin flow.
 */

export type DuplicateMatchType = 'EXACT';

export type ReceiptMatch = {
  paymentId: string;
  matchType: DuplicateMatchType;
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  courseTitle: string | null;
  receiptUrl: string | null;
  status: string;
  createdAt: string;
};

export function sha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

let ensureColumnsPromise: Promise<void> | null = null;
let presentColumnsPromise: Promise<Set<string>> | null = null;

/**
 * Every column these payment features read. The check below requires all of
 * them: a database carrying only an earlier subset must count as "not ready",
 * or a query selects a column that does not exist and the whole page 500s.
 * Add new columns here *and* to the ALTER below, together.
 */
const PAYMENT_COLUMNS = [
  'receiptFileHash',
  'duplicateOfPaymentId',
  'duplicateMatchType',
  'receiptCheckedAt',
  'ocrReference',
  'ocrAmount',
  'ocrText',
  'ocrSource',
  'ocrConfidence',
  'ocrScannedAt',
  'paidAmount',
  'rejectionReason',
];

/** The six columns that cache a receipt read. Checked as a group by the scan route. */
const OCR_COLUMNS = [
  'ocrReference',
  'ocrAmount',
  'ocrText',
  'ocrSource',
  'ocrConfidence',
  'ocrScannedAt',
];

/**
 * Every column "Payment" actually has, cached for the life of the process.
 *
 * Deliberately selects the names rather than counting a match, so a caller can
 * ask about one column instead of all twelve. A half-migrated database is the
 * normal case on a server whose DB user cannot run DDL: approving a payment
 * must not fail just because the OCR cache columns are absent.
 */
export async function presentPaymentColumns(): Promise<Set<string>> {
  if (!presentColumnsPromise) {
    presentColumnsPromise = (async () => {
      try {
        const result = await db.query<{ column_name: string }>(
          `SELECT column_name
             FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'Payment'`
        );
        return new Set(result.rows.map((row) => row.column_name));
      } catch (error) {
        console.error('[presentPaymentColumns] Failed to inspect schema:', error);
        // An empty set disables every optional feature, which is the safe
        // direction: queries then avoid the columns entirely.
        return new Set<string>();
      }
    })();
  }

  return presentColumnsPromise;
}

/** Whether one named column exists. */
export async function hasPaymentColumn(column: string): Promise<boolean> {
  return (await presentPaymentColumns()).has(column);
}

/** Whether the receipt-read cache columns all exist. */
export async function hasOcrColumns(): Promise<boolean> {
  const present = await presentPaymentColumns();
  return OCR_COLUMNS.every((column) => present.has(column));
}

/**
 * Whether *all* the payment feature columns exist. The payments list branches
 * on this: some production DB users cannot run DDL, and the list must keep
 * working without these features rather than erroring on missing columns.
 */
export async function hasPaymentColumns(): Promise<boolean> {
  const present = await presentPaymentColumns();
  return PAYMENT_COLUMNS.every((column) => present.has(column));
}

/**
 * Adds the payment feature columns. Mirrors ensureCourseVisibilityColumn:
 * some production DB users cannot run DDL, so failures are logged, not thrown.
 */
export async function ensurePaymentColumns(): Promise<void> {
  if (!ensureColumnsPromise) {
    ensureColumnsPromise = (async () => {
      // Deliberately no "already present?" short-circuit. Every statement below
      // is IF NOT EXISTS, so running it costs nothing, and skipping it on the
      // strength of one pre-existing column is what leaves a database stuck on
      // an older subset when this list grows.
      try {
        await db.query(`
          ALTER TABLE "Payment"
            ADD COLUMN IF NOT EXISTS "receiptFileHash" CHAR(64),
            ADD COLUMN IF NOT EXISTS "duplicateOfPaymentId" VARCHAR(36),
            ADD COLUMN IF NOT EXISTS "duplicateMatchType" VARCHAR(16),
            ADD COLUMN IF NOT EXISTS "receiptCheckedAt" TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS "ocrReference" VARCHAR(64),
            ADD COLUMN IF NOT EXISTS "ocrAmount" NUMERIC(12, 2),
            ADD COLUMN IF NOT EXISTS "ocrText" TEXT,
            ADD COLUMN IF NOT EXISTS "ocrSource" VARCHAR(16),
            ADD COLUMN IF NOT EXISTS "ocrConfidence" SMALLINT,
            ADD COLUMN IF NOT EXISTS "ocrScannedAt" TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS "paidAmount" NUMERIC(12, 2),
            ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT
        `);
        await db.query(
          'CREATE INDEX IF NOT EXISTS idx_payment_receipt_file_hash ON "Payment"("receiptFileHash")'
        );
        await db.query(
          'CREATE INDEX IF NOT EXISTS idx_payment_duplicate_of ON "Payment"("duplicateOfPaymentId")'
        );
        await db.query(`
          DO $$ BEGIN
            ALTER TABLE "Payment"
              ADD CONSTRAINT payment_duplicate_of_fkey
              FOREIGN KEY ("duplicateOfPaymentId") REFERENCES "Payment"(id) ON DELETE SET NULL;
          EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        `);
      } catch (error) {
        console.warn('[ensurePaymentColumns] Unable to run schema update:', error);
      } finally {
        // Re-read the schema either way. On success the new columns must become
        // visible; on failure the cache must not keep claiming they exist.
        presentColumnsPromise = null;
      }
    })().catch((error) => {
      ensureColumnsPromise = null;
      throw error;
    });
  }

  await ensureColumnsPromise;
}

type MatchQuery = {
  fileHash: string;
  /** Exclude this payment, and only consider receipts uploaded before it. */
  paymentId: string;
  createdAt: Date | string;
};

/** Earlier payments whose receipt file is byte-identical, oldest first. */
export async function findReceiptMatches({
  fileHash,
  paymentId,
  createdAt,
}: MatchQuery): Promise<ReceiptMatch[]> {
  const result = await db.query<Omit<ReceiptMatch, 'matchType'>>(
    `SELECT
        p.id as "paymentId",
        p.status,
        p."createdAt",
        p."receiptUrl",
        u.id as "studentId",
        u.name as "studentName",
        u.email as "studentEmail",
        c.title as "courseTitle"
      FROM "Payment" p
      JOIN "User" u ON p."studentId" = u.id
      JOIN "Course" c ON p."courseId" = c.id
      -- Row comparison gives a total order, so a tie on createdAt cannot make
      -- two payments point at each other.
      WHERE (p."createdAt", p.id) < ($1::timestamptz, $2::varchar)
        AND p."receiptFileHash" = $3
      ORDER BY p."createdAt" ASC`,
    [createdAt, paymentId, fileHash]
  );

  return result.rows.map((row) => ({ ...row, matchType: 'EXACT' as const }));
}

export type FingerprintResult = {
  fileHash: string;
  matches: ReceiptMatch[];
};

/**
 * Hashes a stored receipt, records the fingerprint, and links the payment to the
 * earliest identical receipt. Never throws: a fingerprinting failure must not
 * block a student's upload or an admin's review.
 */
export async function fingerprintPaymentReceipt(
  paymentId: string,
  receiptUrl: string | null | undefined,
  createdAt: Date | string
): Promise<FingerprintResult | null> {
  const diskPath = resolveUploadDiskPath(receiptUrl);
  if (!diskPath) return null;

  try {
    await ensurePaymentColumns();

    const fileHash = sha256(await readFile(diskPath));
    const matches = await findReceiptMatches({ fileHash, paymentId, createdAt });
    const best = matches[0] ?? null;

    await db.query(
      `UPDATE "Payment" SET
         "receiptFileHash" = $2,
         "duplicateOfPaymentId" = $3,
         "duplicateMatchType" = $4,
         "receiptCheckedAt" = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [paymentId, fileHash, best?.paymentId ?? null, best?.matchType ?? null]
    );

    return { fileHash, matches };
  } catch (error) {
    console.error(`[fingerprintPaymentReceipt] Failed for payment ${paymentId}:`, error);
    return null;
  }
}
