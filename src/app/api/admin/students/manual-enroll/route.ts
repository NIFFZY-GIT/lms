import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { lastDayOfMonth } from 'date-fns';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role } from '@/types';

type CourseRow = {
  id: string;
  title: string;
  courseType: 'ONE_TIME_PURCHASE' | 'SUBSCRIPTION';
  createdById: string;
};

function getSubscriptionExpiryDate(): Date {
  const now = new Date();
  const endOfMonth = lastDayOfMonth(now);
  endOfMonth.setHours(23, 59, 59, 999);
  return endOfMonth;
}

export async function POST(req: Request) {
  try {
    const user = await getServerUser([Role.ADMIN, Role.INSTRUCTOR]);
    const body = await req.json() as { studentId?: string; courseIds?: string[] };
    const studentId = body.studentId?.trim();
    const uniqueCourseIds = Array.from(new Set((body.courseIds ?? []).filter(Boolean)));

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required.' }, { status: 400 });
    }

    if (!uniqueCourseIds.length) {
      return NextResponse.json({ error: 'Select at least one course.' }, { status: 400 });
    }

    const studentCheck = await db.query<{ id: string; role: Role }>(
      'SELECT id, role FROM "User" WHERE id = $1',
      [studentId]
    );

    if (!studentCheck.rows.length) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    }

    if (studentCheck.rows[0].role !== Role.STUDENT) {
      return NextResponse.json({ error: 'Selected user is not a student.' }, { status: 400 });
    }

    const courseRows = await db.query<CourseRow>(
      'SELECT id, title, "courseType", "createdById" FROM "Course" WHERE id = ANY($1::varchar[])',
      [uniqueCourseIds]
    );

    if (!courseRows.rows.length) {
      return NextResponse.json({ error: 'No valid courses found.' }, { status: 404 });
    }

    const foundCourseIds = new Set(courseRows.rows.map((c) => c.id));
    const invalidCourseIds = uniqueCourseIds.filter((id) => !foundCourseIds.has(id));

    if (user.role === Role.INSTRUCTOR) {
      const hasForeignCourse = courseRows.rows.some((course) => course.createdById !== user.id);
      if (hasForeignCourse) {
        return NextResponse.json({ error: 'Instructors can only enroll students in their own courses.' }, { status: 403 });
      }
    }

    const enrolledCourseIds: string[] = [];
    const skippedCourseIds: string[] = [];
    const subscriptionExpiryDate = getSubscriptionExpiryDate();

    await db.query('BEGIN');

    for (const course of courseRows.rows) {
      if (course.courseType === 'ONE_TIME_PURCHASE') {
        const approvedOneTime = await db.query(
          `SELECT id FROM "Payment"
           WHERE "studentId" = $1 AND "courseId" = $2 AND status = 'APPROVED'
           LIMIT 1`,
          [studentId, course.id]
        );

        if (approvedOneTime.rows.length) {
          skippedCourseIds.push(course.id);
          continue;
        }

        const reusablePayment = await db.query<{ id: string }>(
          `SELECT id FROM "Payment"
           WHERE "studentId" = $1 AND "courseId" = $2 AND status IN ('PENDING', 'REJECTED')
           ORDER BY "createdAt" DESC
           LIMIT 1`,
          [studentId, course.id]
        );

        if (reusablePayment.rows.length) {
          await db.query(
            `UPDATE "Payment"
             SET status = 'APPROVED',
                 "receiptUrl" = NULL,
                 "referenceNumber" = $1,
                 "subscriptionExpiryDate" = NULL,
                 "updatedAt" = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [`MANUAL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, reusablePayment.rows[0].id]
          );
        } else {
          await db.query(
            `INSERT INTO "Payment" (id, "studentId", "courseId", "receiptUrl", status, "referenceNumber")
             VALUES ($1, $2, $3, NULL, 'APPROVED', $4)`,
            [uuidv4(), studentId, course.id, `MANUAL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`]
          );
        }

        enrolledCourseIds.push(course.id);
        continue;
      }

      const activeSubscription = await db.query(
        `SELECT id FROM "Payment"
         WHERE "studentId" = $1 AND "courseId" = $2
           AND status = 'APPROVED'
           AND "subscriptionExpiryDate" > CURRENT_TIMESTAMP
         LIMIT 1`,
        [studentId, course.id]
      );

      if (activeSubscription.rows.length) {
        skippedCourseIds.push(course.id);
        continue;
      }

      await db.query(
        `INSERT INTO "Payment" (id, "studentId", "courseId", "receiptUrl", status, "referenceNumber", "subscriptionExpiryDate")
         VALUES ($1, $2, $3, NULL, 'APPROVED', $4, $5)`,
        [uuidv4(), studentId, course.id, `MANUAL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, subscriptionExpiryDate]
      );
      enrolledCourseIds.push(course.id);
    }

    await db.query('COMMIT');

    return NextResponse.json({
      message: 'Manual enrollment processed.',
      enrolledCourseIds,
      skippedCourseIds,
      invalidCourseIds,
    });
  } catch (error) {
    try {
      await db.query('ROLLBACK');
    } catch {}
    console.error('Manual enrollment error:', error);
    return NextResponse.json({ error: 'Failed to manually enroll student.' }, { status: 500 });
  }
}
