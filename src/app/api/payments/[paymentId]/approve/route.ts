import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { getServerUser } from '../../../../../lib/auth';
import { Role } from '../../../../../types';

export async function PATCH(req: Request, { params }: { params: { paymentId: string } }) {
  try {
    await getServerUser(Role.ADMIN);
    const { paymentId } = params;
    const { referenceNumber } = await req.json();

    if (!referenceNumber) {
      return NextResponse.json({ error: 'Reference number is required for approval.' }, { status: 400 });
    }

    const sql = `
      UPDATE "Payment"
      SET status = 'APPROVED', "referenceNumber" = $1, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $2 RETURNING *;
    `;
    const result = await db.query(sql, [referenceNumber, paymentId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    // The UNIQUE constraint on referenceNumber will cause an error here if it's a duplicate
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return NextResponse.json({ error: 'This reference number has already been used.' }, { status: 409 });
    }
    // ... other error handling
  }
}