import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role } from '@/types';
import {
  ensurePaymentColumns,
  fingerprintPaymentReceipt,
} from '@/lib/receipt-duplicates';

const DEFAULT_BATCH = 250;
const MAX_BATCH = 1000;

type PendingRow = {
  id: string;
  receiptUrl: string | null;
  createdAt: string;
};

/**
 * Fingerprints receipts that predate the duplicate-detection feature.
 *
 * Processes oldest-first so each receipt is compared against everything that
 * came before it. Safe to call repeatedly; use ?force=1 to re-check receipts
 * that already have a fingerprint (e.g. after changing the match threshold).
 */
export async function POST(req: Request) {
  try {
    await getServerUser(Role.ADMIN);
    await ensurePaymentColumns();

    const url = new URL(req.url);
    const force = url.searchParams.get('force') === '1';
    const requested = Number(url.searchParams.get('limit'));
    const limit = Number.isFinite(requested) && requested > 0
      ? Math.min(Math.floor(requested), MAX_BATCH)
      : DEFAULT_BATCH;

    const pendingFilter = force ? '' : 'AND "receiptCheckedAt" IS NULL';

    const pending = await db.query<PendingRow>(
      `SELECT id, "receiptUrl", "createdAt"
         FROM "Payment"
        WHERE "receiptUrl" IS NOT NULL ${pendingFilter}
        ORDER BY "createdAt" ASC
        LIMIT $1`,
      [limit]
    );

    let scanned = 0;
    let flagged = 0;
    let skipped = 0;
    const duplicates: Array<{
      paymentId: string;
      matchesPaymentId: string;
      matchType: string;
      matchedStudent: string | null;
    }> = [];

    for (const row of pending.rows) {
      const result = await fingerprintPaymentReceipt(row.id, row.receiptUrl, row.createdAt);
      if (!result) {
        // Missing file on disk, or an unreadable upload.
        skipped++;
        continue;
      }
      scanned++;
      const best = result.matches[0];
      if (best) {
        flagged++;
        duplicates.push({
          paymentId: row.id,
          matchesPaymentId: best.paymentId,
          matchType: best.matchType,
          matchedStudent: best.studentName,
        });
      }
    }

    const remainingResult = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM "Payment"
        WHERE "receiptUrl" IS NOT NULL AND "receiptCheckedAt" IS NULL`
    );

    return NextResponse.json({
      scanned,
      flagged,
      skipped,
      remaining: Number(remainingResult.rows[0]?.count ?? 0),
      duplicates,
    });
  } catch (error) {
    console.error('Receipt rescan error:', error);
    return NextResponse.json({ error: 'Failed to rescan receipts.' }, { status: 500 });
  }
}
