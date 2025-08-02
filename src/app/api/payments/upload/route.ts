import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises'; // <-- 1. Import mkdir
import path from 'path';

export async function POST(req: Request) {
  try {
    const user = await getServerUser(Role.STUDENT);
    const formData = await req.formData();
    const courseId = formData.get('courseId') as string;
    const receiptFile = formData.get('receipt') as File | null;

    if (!courseId || !receiptFile) {
      return NextResponse.json({ error: 'Course ID and receipt file are required.' }, { status: 400 });
    }

    const uniqueFilename = `${Date.now()}-${receiptFile.name.replace(/\s+/g, '_')}`;

    // --- THIS IS THE FIX ---
    // 1. Define the directory path where files will be stored.
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'receipts');

    // 2. Ensure the directory exists.
    // The { recursive: true } option means it will create parent directories if they don't exist
    // and it won't throw an error if the directory already exists.
    await mkdir(uploadDir, { recursive: true });

    // 3. Define the full save path for the file.
    const savePath = path.join(uploadDir, uniqueFilename);
    
    // Continue with the rest of the logic...
    const buffer = Buffer.from(await receiptFile.arrayBuffer());
    await writeFile(savePath, buffer);

    const publicUrl = `/uploads/receipts/${uniqueFilename}`;

    const existingPayment = await db.query('SELECT id FROM "Payment" WHERE "studentId" = $1 AND "courseId" = $2', [user.id, courseId]);
    if (existingPayment.rows.length > 0) {
      return NextResponse.json({ error: 'You have already submitted a payment for this course.' }, { status: 409 });
    }

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