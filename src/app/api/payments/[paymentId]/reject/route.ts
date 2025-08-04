import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role } from '@/types';

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

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Payment rejection error:", error);
    return NextResponse.json({ error: 'Failed to reject payment' }, { status: 500 });
  }
}