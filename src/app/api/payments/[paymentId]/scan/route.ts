import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role } from '@/types';
import { resolveUploadDiskPath } from '@/lib/uploads';
import { scanReceipt } from '@/lib/receipt-ocr';
import { ensurePaymentColumns, hasOcrColumns } from '@/lib/receipt-duplicates';

type ScanRow = {
  receiptUrl: string | null;
  ocrReference: string | null;
  ocrAmount: string | null;
  ocrSource: string | null;
  ocrConfidence: number | null;
  ocrScannedAt: string | null;
};

/**
 * Reads the reference number and amount off a receipt.
 *
 * Runs on demand when an admin opens a payment for review rather than at upload
 * time — OCR takes a second or two and a student should not wait on it. The
 * result is cached on the row, so each receipt is only ever read once.
 * Pass ?force=1 to re-read a receipt that was already scanned.
 */
export async function POST(req: Request, props: { params: Promise<{ paymentId: string }> }) {
  try {
    await getServerUser(Role.ADMIN);
    await ensurePaymentColumns();

    const { paymentId } = await props.params;
    const force = new URL(req.url).searchParams.get('force') === '1';

    // Without these columns the read cannot be cached — but it can still be
    // performed. Selecting them unconditionally is what made this route fail
    // with "Failed to scan the receipt" on a half-migrated database.
    const withCache = await hasOcrColumns();

    const result = await db.query<ScanRow>(
      withCache
        ? `SELECT "receiptUrl", "ocrReference", "ocrAmount", "ocrSource", "ocrConfidence", "ocrScannedAt"
             FROM "Payment" WHERE id = $1`
        : `SELECT "receiptUrl", NULL AS "ocrReference", NULL AS "ocrAmount", NULL AS "ocrSource",
                  NULL::int AS "ocrConfidence", NULL AS "ocrScannedAt"
             FROM "Payment" WHERE id = $1`,
      [paymentId]
    );

    const payment = result.rows[0];
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
    }
    if (!payment.receiptUrl) {
      return NextResponse.json({ error: 'This payment has no receipt to scan.' }, { status: 400 });
    }

    // Earlier versions of the reader could return the label instead of its
    // value ("NUMBER", "DETAILS") when a slip put the two on separate lines.
    // A cached reference with no digits in it is one of those, so re-read it
    // rather than showing the admin a word. A cached *null* is left alone —
    // that is a real "nothing found", and re-running OCR costs seconds.
    const cachedIsJunk =
      payment.ocrReference !== null && !/\d/.test(payment.ocrReference);

    // Serve the cached read unless a re-scan was explicitly requested.
    if (payment.ocrScannedAt && !force && !cachedIsJunk) {
      return NextResponse.json({
        cached: true,
        referenceNumber: payment.ocrReference,
        amount: payment.ocrAmount === null ? null : Number(payment.ocrAmount),
        source: payment.ocrSource,
        confidence: payment.ocrConfidence,
      });
    }

    const diskPath = resolveUploadDiskPath(payment.receiptUrl);
    if (!diskPath) {
      return NextResponse.json({ error: 'Receipt file could not be located.' }, { status: 404 });
    }

    let buffer: Buffer;
    try {
      buffer = await readFile(diskPath);
    } catch {
      return NextResponse.json({ error: 'Receipt file is missing from storage.' }, { status: 404 });
    }

    const scan = await scanReceipt(buffer);
    if (!scan) {
      return NextResponse.json({ error: 'Could not read this receipt. Enter the details manually.' }, { status: 422 });
    }

    if (withCache) {
      await db.query(
        `UPDATE "Payment" SET
           "ocrReference" = $2,
           "ocrAmount" = $3,
           "ocrText" = $4,
           "ocrSource" = $5,
           "ocrConfidence" = $6,
           "ocrScannedAt" = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [paymentId, scan.referenceNumber, scan.amount, scan.text, scan.source, scan.confidence]
      );
    }

    return NextResponse.json({
      cached: false,
      referenceNumber: scan.referenceNumber,
      amount: scan.amount,
      source: scan.source,
      confidence: scan.confidence,
    });
  } catch (error) {
    console.error('Receipt scan error:', error);
    return NextResponse.json({ error: 'Failed to scan the receipt.' }, { status: 500 });
  }
}
