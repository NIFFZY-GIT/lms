import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';
import { v4 as uuidv4 } from 'uuid';
import { IMAGE_10MB, assertFile } from '@/lib/security';
import { saveUploadFile, removeUploadByUrl } from '@/lib/uploads';
import { sendReceiptUploadedEmailToAdmins } from '@/lib/notify';

export async function POST(req: Request) {
  try {
    const user = await getServerUser(Role.STUDENT);
    const formData = await req.formData();
    const courseId = formData.get('courseId') as string;
    const receiptFile = formData.get('receipt') as File | null;

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required.' }, { status: 400 });
    }

    const courseResult = await db.query<{ id: string; title: string; price: string }>(
      'SELECT id, title, price FROM "Course" WHERE id = $1',
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    }

    const course = courseResult.rows[0];
    const coursePrice = parseFloat(course.price);

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
          await removeUploadByUrl(existingPayment.receiptUrl);
        } catch (fileError) {
          console.error("Failed to delete old rejected receipt file, but proceeding:", fileError);
        }
        // Delete the old payment record from the database
        await db.query('DELETE FROM "Payment" WHERE id = $1', [existingPayment.id]);
      }
    }
    // --- END OF NEW LOGIC ---


    if (coursePrice === 0) {
      const paymentId = uuidv4();
      const freeEnrollmentSql = `
        INSERT INTO "Payment" (id, "studentId", "courseId", "receiptUrl", status)
        VALUES ($1, $2, $3, NULL, 'APPROVED') RETURNING *;
      `;
      const freeEnrollmentResult = await db.query(freeEnrollmentSql, [paymentId, user.id, courseId]);
      return NextResponse.json(freeEnrollmentResult.rows[0], { status: 201 });
    }

    if (!receiptFile) {
      return NextResponse.json({ error: 'Receipt file is required for paid courses.' }, { status: 400 });
    }

    // Validate and proceed with the new file upload and record creation
    try {
      assertFile(receiptFile, IMAGE_10MB, 'receipt');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Invalid file';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  const { publicPath: publicUrl } = await saveUploadFile(receiptFile, 'receipts');
    const paymentId = uuidv4();
    const sql = `
      INSERT INTO "Payment" (id, "studentId", "courseId", "receiptUrl", status)
      VALUES ($1, $2, $3, $4, 'PENDING') RETURNING *;
    `;
    const result = await db.query(sql, [paymentId, user.id, courseId, publicUrl]);

    try {
      const adminResult = await db.query<{ email: string | null }>('SELECT email FROM "User" WHERE role = $1 AND email IS NOT NULL', [Role.ADMIN]);
      const adminEmails = adminResult.rows.map(row => row.email).filter((email): email is string => Boolean(email));

      if (adminEmails.length) {
        const courseTitle = course.title ?? 'a course';
        await sendReceiptUploadedEmailToAdmins(adminEmails, {
          studentName: user.name ?? 'A student',
          studentEmail: user.email,
          courseTitle,
        });
      }
    } catch (emailError) {
      console.error('Receipt upload admin email failed:', emailError);
    }

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: 'Failed to upload receipt.' }, { status: 500 });
  }
}