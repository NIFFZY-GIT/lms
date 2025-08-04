import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { getServerUser } from '../../../../../lib/auth';
import { Role } from '../../../../../types';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const user = await getServerUser(Role.STUDENT);
    const { courseId } = await params;

    // First, find the payment record to get the receipt URL for deletion
    const paymentResult = await db.query(
      'SELECT id, "receiptUrl" FROM "Payment" WHERE "studentId" = $1 AND "courseId" = $2',
      [user.id, courseId]
    );

    if (paymentResult.rows.length === 0) {
      return NextResponse.json({ error: "Enrollment record not found." }, { status: 404 });
    }

    const payment = paymentResult.rows[0];

    // Delete the payment record from the database. This will cascade and delete quiz attempts.
    await db.query('DELETE FROM "Payment" WHERE id = $1', [payment.id]);

    // Delete the receipt file from the server's file system
    if (payment.receiptUrl) {
        try {
            const filePath = path.join(process.cwd(), 'public', payment.receiptUrl);
            await unlink(filePath);
        } catch (fileError) {
            console.error("Failed to delete receipt file, but DB record was removed:", fileError);
        }
    }

    return new NextResponse(null, { status: 204 }); // 204 No Content for successful deletion
  } catch (error) {
    console.error("Unenrollment error:", error);
    return NextResponse.json({ error: 'Failed to unenroll from course.' }, { status: 500 });
  }
}