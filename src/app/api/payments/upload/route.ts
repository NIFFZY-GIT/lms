import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { IMAGE_10MB, assertFile, uniqueFileName } from '@/lib/security';

export async function POST(req: Request) {
  try {
    const user = await getServerUser(Role.STUDENT);
    const formData = await req.formData();
    const courseId = formData.get('courseId') as string;
    const receiptFile = formData.get('receipt') as File | null;

    if (!courseId || !receiptFile) {
      return NextResponse.json({ error: 'Course ID and receipt file are required.' }, { status: 400 });
    }

    // --- THIS IS THE NEW LOGIC ---
    // Check if a payment record already exists for this user and course.
    const existingPaymentResult = await db.query('SELECT id, status, "receiptUrl" FROM "Payment" WHERE "studentId" = $1 AND "courseId" = $2', [user.id, courseId]);
    
    if (existingPaymentResult.rows.length > 0) {
      const existingPayment = existingPaymentResult.rows[0];
      
      // If payment is PENDING or APPROVED, they cannot re-apply.
      if (existingPayment.status === 'PENDING' || existingPayment.status === 'APPROVED') {
        return NextResponse.json({ error: 'A payment for this course is already pending or has been approved.' }, { status: 409 });
      }

      // If payment was REJECTED, we will delete the old record to allow re-submission.
      if (existingPayment.status === 'REJECTED') {
        // Delete the old receipt file from the server
        try {
          const oldFilePath = path.join(process.cwd(), 'public', existingPayment.receiptUrl);
          await unlink(oldFilePath);
        } catch (fileError) {
          console.error("Failed to delete old rejected receipt file, but proceeding:", fileError);
        }
        
        // Delete the old payment record from the database
        await db.query('DELETE FROM "Payment" WHERE id = $1', [existingPayment.id]);
      }
    }
    // --- END OF NEW LOGIC ---


    // Validate and proceed with the new file upload and record creation
    try {
      assertFile(receiptFile, IMAGE_10MB, 'receipt');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Invalid file';
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const uniqueFilename = uniqueFileName(receiptFile.name);
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
    await mkdir(uploadDir, { recursive: true });
    
    const savePath = path.join(uploadDir, uniqueFilename);
    const buffer = Buffer.from(await receiptFile.arrayBuffer());
    await writeFile(savePath, buffer);

    const publicUrl = `/uploads/receipts/${uniqueFilename}`;
    const paymentId = uuidv4();
    const sql = `
      INSERT INTO "Payment" (id, "studentId", "courseId", "receiptUrl", status)
      VALUES ($1, $2, $3, $4, 'PENDING') RETURNING *;
    `;
    const result = await db.query(sql, [paymentId, user.id, courseId, publicUrl]);
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: 'Failed to upload receipt.' }, { status: 500 });
  }
}