import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';
import { v4 as uuidv4 } from 'uuid';
import { IMAGE_OR_PDF_10MB, assertFile } from '@/lib/security';
import { saveUploadFile, removeUploadByUrl } from '@/lib/uploads';
import {
  sendEnrollmentStatusToStaff,
  sendEnrollmentSubmittedEmail,
  sendPaymentApprovedEmail,
  sendReceiptUploadedEmailToAdmins,
} from '@/lib/notify';
import { lastDayOfMonth } from 'date-fns';
import { ensureCourseVisibilityColumn } from '@/lib/course-visibility';

// Helper: Get the last day of the current month (end of day)
function getSubscriptionExpiryDate(): Date {
  const now = new Date();
  const endOfMonth = lastDayOfMonth(now);
  endOfMonth.setHours(23, 59, 59, 999);
  return endOfMonth;
}

export async function POST(req: Request) {
  try {
    await ensureCourseVisibilityColumn();

    const user = await getServerUser(Role.STUDENT);
    const formData = await req.formData();
    const courseId = formData.get('courseId') as string;
    const receiptFile = formData.get('receipt') as File | null;

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required.' }, { status: 400 });
    }

    const courseResult = await db.query<{ id: string; title: string; price: string; courseType: string; isHidden: boolean; createdById: string }>(
      'SELECT id, title, price, "courseType", "isHidden", "createdById" FROM "Course" WHERE id = $1',
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    }

    const course = courseResult.rows[0];
    if (course.isHidden) {
      return NextResponse.json({ error: 'This course is currently hidden and cannot be enrolled in.' }, { status: 403 });
    }

    const coursePrice = parseFloat(course.price);
    const courseType = course.courseType || 'ONE_TIME_PURCHASE';
    const isSubscription = courseType === 'SUBSCRIPTION';

    // --- UPDATED LOGIC FOR ONE-TIME AND SUBSCRIPTION ---
    // For ONE_TIME_PURCHASE courses, check if a payment already exists
    if (!isSubscription) {
      const existingPaymentResult = await db.query(
        'SELECT id, status, "receiptUrl" FROM "Payment" WHERE "studentId" = $1 AND "courseId" = $2',
        [user.id, courseId]
      );
      
      if (existingPaymentResult.rows.length > 0) {
        const existingPayment = existingPaymentResult.rows[0];
        
        // If payment is PENDING or APPROVED, they cannot re-apply.
        if (existingPayment.status === 'PENDING' || existingPayment.status === 'APPROVED') {
          return NextResponse.json({ 
            error: 'A payment for this course is already pending or has been approved.' 
          }, { status: 409 });
        }

        // If payment was REJECTED, allow re-submission
        if (existingPayment.status === 'REJECTED') {
          try {
            await removeUploadByUrl(existingPayment.receiptUrl);
          } catch (fileError) {
            console.error("Failed to delete old rejected receipt file, but proceeding:", fileError);
          }
          await db.query('DELETE FROM "Payment" WHERE id = $1', [existingPayment.id]);
        }
      }
    } else {
      // For SUBSCRIPTION courses, check if there's an active (APPROVED) payment for the current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = lastDayOfMonth(now);
      endOfMonth.setHours(23, 59, 59, 999);

      const activePaymentResult = await db.query(
        `SELECT id, status FROM "Payment" 
         WHERE "studentId" = $1 AND "courseId" = $2 AND status = 'APPROVED' 
         AND "subscriptionExpiryDate" > CURRENT_TIMESTAMP`,
        [user.id, courseId]
      );

      if (activePaymentResult.rows.length > 0) {
        return NextResponse.json({ 
          error: 'You already have an active subscription for this month.' 
        }, { status: 409 });
      }

      // Check for pending payments for the current month
      const pendingPaymentResult = await db.query(
        `SELECT id FROM "Payment" 
         WHERE "studentId" = $1 AND "courseId" = $2 AND status = 'PENDING' 
         AND "createdAt" > $3`,
        [user.id, courseId, startOfMonth]
      );

      if (pendingPaymentResult.rows.length > 0) {
        return NextResponse.json({ 
          error: 'You already have a pending subscription payment for this month.' 
        }, { status: 409 });
      }
    }
    // --- END OF UPDATED LOGIC ---

    if (coursePrice === 0) {
      const paymentId = uuidv4();
      const subscriptionExpiryDate = isSubscription ? getSubscriptionExpiryDate() : null;
      const freeEnrollmentSql = isSubscription
        ? `INSERT INTO "Payment" (id, "studentId", "courseId", "receiptUrl", status, "subscriptionExpiryDate")
           VALUES ($1, $2, $3, NULL, 'APPROVED', $4) RETURNING *;`
        : `INSERT INTO "Payment" (id, "studentId", "courseId", "receiptUrl", status)
           VALUES ($1, $2, $3, NULL, 'APPROVED') RETURNING *;`;
      
      const params = isSubscription 
        ? [paymentId, user.id, courseId, subscriptionExpiryDate]
        : [paymentId, user.id, courseId];
      
      const freeEnrollmentResult = await db.query(freeEnrollmentSql, params);

      try {
        await sendPaymentApprovedEmail(
          user.email,
          user.name ?? 'Student',
          course.title,
          'FREE-ENROLLMENT'
        );

        const staffResult = await db.query<{ email: string | null }>(
          `
          SELECT DISTINCT email
          FROM "User"
          WHERE email IS NOT NULL
            AND (role = ANY($1) OR id = $2)
          `,
          [[Role.ADMIN, Role.INSTRUCTOR], course.createdById]
        );
        const staffEmails = staffResult.rows
          .map((row) => row.email)
          .filter((email): email is string => Boolean(email));

        await sendEnrollmentStatusToStaff(staffEmails, {
          studentName: user.name ?? 'A student',
          studentEmail: user.email,
          courseTitle: course.title,
          status: 'APPROVED',
        });
      } catch (emailError) {
        console.error('Free enrollment emails failed:', emailError);
      }

      return NextResponse.json(freeEnrollmentResult.rows[0], { status: 201 });
    }

    if (!receiptFile) {
      return NextResponse.json({ error: 'Receipt file is required for paid courses.' }, { status: 400 });
    }

    // Validate and proceed with the file upload
    try {
      assertFile(receiptFile, IMAGE_OR_PDF_10MB, 'receipt');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Invalid file';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { publicPath: publicUrl } = await saveUploadFile(receiptFile, 'receipts');
    const paymentId = uuidv4();
    
    // Note: subscriptionExpiryDate will be set to the end of current month when the payment is APPROVED by admin
    const sql = isSubscription
      ? `INSERT INTO "Payment" (id, "studentId", "courseId", "receiptUrl", status, "subscriptionExpiryDate")
         VALUES ($1, $2, $3, $4, 'PENDING', NULL) RETURNING *;`
      : `INSERT INTO "Payment" (id, "studentId", "courseId", "receiptUrl", status)
         VALUES ($1, $2, $3, $4, 'PENDING') RETURNING *;`;
    
    const result = await db.query(sql, [paymentId, user.id, courseId, publicUrl]);

    try {
      await sendEnrollmentSubmittedEmail(user.email, {
        name: user.name ?? 'Student',
        courseTitle: course.title,
        isSubscription,
      });

      const adminResult = await db.query<{ email: string | null }>(
        `
        SELECT DISTINCT email
        FROM "User"
        WHERE email IS NOT NULL
          AND (role = ANY($1) OR id = $2)
        `,
        [[Role.ADMIN, Role.INSTRUCTOR], course.createdById]
      );
      const adminEmails = adminResult.rows.map(row => row.email).filter((email): email is string => Boolean(email));

      if (adminEmails.length) {
        const courseTitle = course.title ?? 'a course';
        const paymentType = isSubscription ? 'subscription' : 'one-time purchase';
        await sendReceiptUploadedEmailToAdmins(adminEmails, {
          studentName: user.name ?? 'A student',
          studentEmail: user.email,
          courseTitle: `${courseTitle} (${paymentType})`,
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