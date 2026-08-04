import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getServerUser } from '../../../lib/auth';
import { Role } from '../../../types';
import {
  ensurePaymentColumns,
  hasPaymentColumns,
} from '@/lib/receipt-duplicates';
import { buildPaymentsSql } from '@/lib/payments-query';

export async function GET() {
  try {
    await getServerUser(Role.ADMIN);
    await ensurePaymentColumns();

    // If the DB user could not add the columns, skip straight to a query that
    // does not mention them rather than failing the whole page.
    const withDuplicates = await hasPaymentColumns();

    // Most specific first. Each tier is tried once and any failure is logged
    // with the tier name, so the server log names the column that is missing
    // instead of leaving an admin staring at an empty table.
    const tiers: { name: string; sql: string }[] = [
      ...(withDuplicates
        ? [{
            name: 'duplicates+price',
            sql: buildPaymentsSql({ withDuplicates: true, withPrice: true }),
          }]
        : []),
      { name: 'price', sql: buildPaymentsSql({ withDuplicates: false, withPrice: true }) },
      { name: 'base', sql: buildPaymentsSql({ withDuplicates: false, withPrice: false }) },
    ];

    for (let i = 0; i < tiers.length; i += 1) {
      const { name, sql } = tiers[i];
      const isLastTier = i === tiers.length - 1;
      try {
        const result = await db.query(sql);
        return NextResponse.json(result.rows);
      } catch (error) {
        if (isLastTier) throw error;
        console.error(
          `[GET /api/payments] "${name}" query failed, retrying without those columns:`,
          error
        );
      }
    }

    // Unreachable: the loop either returns or throws on the last tier.
    return NextResponse.json([]);
  } catch (error) {
    console.error("Fetch payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
