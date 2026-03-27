import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';
import { IMAGE_5MB, assertFile } from '@/lib/security';
import { saveUploadFile, removeUploadByUrl } from '@/lib/uploads';
import { ensureCourseVisibilityColumn } from '@/lib/course-visibility';
import { ensureCourseScheduleColumns, hasCourseScheduleColumns } from '@/lib/course-schedule';
import { sendCourseUpdatedEmail } from '@/lib/notify';

const VALID_WEEK_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
const TIME_24H_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const normalizeOptionalString = (value: FormDataEntryValue | null): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
};

const normalizeTimeForComparison = (timeValue: string | null): string | null => {
    if (!timeValue) return null;
    return timeValue.slice(0, 5);
};

// --- GET function (no changes) ---
export async function GET(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
        await ensureCourseVisibilityColumn();

    const user = await getServerUser();
    const { courseId } = await params;

    const courseResult = await db.query('SELECT * FROM "Course" WHERE id = $1', [courseId]);
    if (courseResult.rows.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    const course = courseResult.rows[0];
    course.price = parseFloat(course.price);

    const paymentResult = await db.query('SELECT status FROM "Payment" WHERE "studentId" = $1 AND "courseId" = $2', [user.id, courseId]);
    const enrollmentStatus = paymentResult.rows[0]?.status || null;

        if (course.isHidden && user.role === Role.STUDENT && enrollmentStatus !== 'APPROVED') {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

    if (enrollmentStatus === 'APPROVED') {
      const recordingsResult = await db.query('SELECT * FROM "Recording" WHERE "courseId" = $1 ORDER BY "createdAt" ASC', [courseId]);
      const quizzesResult = await db.query('SELECT id, title FROM "Quiz" WHERE "courseId" = $1 ORDER BY "createdAt" ASC', [courseId]);
            const tutorialsResult = await db.query('SELECT * FROM "CourseTutorial" WHERE "courseId" = $1 ORDER BY "createdAt" ASC', [courseId]);
            course.recordings = recordingsResult.rows;
            course.quizzes = quizzesResult.rows;
            course.tutorials = tutorialsResult.rows;
        } else {
            course.recordings = [];
            course.quizzes = [];
            course.tutorials = [];
        }
    
    return NextResponse.json({ ...course, enrollmentStatus });
  } catch (error) {
    console.error("Fetch course details error:", error);
    return NextResponse.json({ error: 'Failed to fetch course details' }, { status: 500 });
  }
}

// --- PATCH function (no changes) ---
export async function PATCH(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
    try {
        await ensureCourseVisibilityColumn();
        await ensureCourseScheduleColumns();
        const scheduleColumnsReady = await hasCourseScheduleColumns();

        const user = await getServerUser([Role.ADMIN, Role.INSTRUCTOR]);
        const { courseId } = await params;
        if (user.role === Role.INSTRUCTOR) {
            const ownerCheck = await db.query('SELECT "createdById" FROM "Course" WHERE id = $1', [courseId]);
            if (ownerCheck.rows.length === 0) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
            if (ownerCheck.rows[0].createdById !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        const formData = await req.formData();

        const fields: string[] = [];
        const changedFields: string[] = [];
        const values: (string | number | boolean | null)[] = [];
        let queryIndex = 1;

        // Process text fields
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const price = formData.get('price') as string;
        const courseType = formData.get('courseType') as string;
        const tutor = formData.get('tutor') as string;
        const zoomLink = formData.get('zoomLink') as string;
        const whatsappGroupLink = formData.get('whatsappGroupLink') as string;
        const subject = formData.get('subject');
        const grade = formData.get('grade');
        const medium = formData.get('medium');
        const isHidden = formData.get('isHidden');
        const scheduleModeInput = formData.get('scheduleMode');
        const weeklyDayInput = formData.get('weeklyDay');
        const startTimeInput = formData.get('startTime');
        const endTimeInput = formData.get('endTime');
        const scheduleNoteInput = formData.get('scheduleNote');
        
        if(title) { fields.push(`title = $${queryIndex++}`); values.push(title); changedFields.push('title'); }
        if(description) { fields.push(`description = $${queryIndex++}`); values.push(description); changedFields.push('description'); }
        if(price) { fields.push(`price = $${queryIndex++}`); values.push(parseFloat(price)); changedFields.push('price'); }
        if (courseType) {
            if (courseType !== 'ONE_TIME_PURCHASE' && courseType !== 'SUBSCRIPTION') {
                return NextResponse.json({ error: 'Invalid course type' }, { status: 400 });
            }
            fields.push(`"courseType" = $${queryIndex++}`);
            values.push(courseType);
            changedFields.push('course type');
        }
        if(tutor) { fields.push(`tutor = $${queryIndex++}`); values.push(tutor); changedFields.push('tutor'); }
        if(zoomLink) { fields.push(`"zoomLink" = $${queryIndex++}`); values.push(zoomLink); changedFields.push('zoom link'); }
        if(whatsappGroupLink) { fields.push(`"whatsappGroupLink" = $${queryIndex++}`); values.push(whatsappGroupLink); changedFields.push('whatsapp link'); }
        if (subject !== null) {
            fields.push(`subject = $${queryIndex++}`);
            values.push(typeof subject === 'string' && subject.trim() ? subject.trim() : null);
            changedFields.push('subject');
        }
        if (grade !== null) {
            fields.push(`grade = $${queryIndex++}`);
            values.push(typeof grade === 'string' && grade.trim() ? grade.trim() : null);
            changedFields.push('grade');
        }
        if (medium !== null) {
            fields.push(`medium = $${queryIndex++}`);
            values.push(typeof medium === 'string' && medium.trim() ? medium.trim() : null);
            changedFields.push('medium');
        }
        if (isHidden !== null) {
            const normalizedIsHidden = typeof isHidden === 'string'
                ? ['1', 'true', 'yes', 'on'].includes(isHidden.toLowerCase())
                : Boolean(isHidden);
            fields.push(`"isHidden" = $${queryIndex++}`);
            values.push(normalizedIsHidden);
            changedFields.push('visibility');
        }

        if (scheduleColumnsReady) {
            const scheduleTouched =
                scheduleModeInput !== null ||
                weeklyDayInput !== null ||
                startTimeInput !== null ||
                endTimeInput !== null ||
                scheduleNoteInput !== null;

            let normalizedScheduleMode: 'WEEKLY' | 'RECORDED' | null = null;
            let normalizedWeeklyDay: string | null = null;
            let normalizedStartTime: string | null = null;
            let normalizedEndTime: string | null = null;
            let normalizedScheduleNote: string | null = null;

            if (scheduleModeInput !== null) {
                const raw = typeof scheduleModeInput === 'string' ? scheduleModeInput.toUpperCase() : '';
                if (raw !== 'WEEKLY' && raw !== 'RECORDED') {
                    return NextResponse.json({ error: 'Invalid schedule mode' }, { status: 400 });
                }
                normalizedScheduleMode = raw;
                fields.push(`"scheduleMode" = $${queryIndex++}`);
                values.push(normalizedScheduleMode);
                changedFields.push('schedule mode');
            }

            if (weeklyDayInput !== null) {
                normalizedWeeklyDay = normalizeOptionalString(weeklyDayInput)?.toUpperCase() ?? null;
                fields.push(`"weeklyDay" = $${queryIndex++}`);
                values.push(normalizedWeeklyDay);
                changedFields.push('class day');
            }

            if (startTimeInput !== null) {
                normalizedStartTime = normalizeOptionalString(startTimeInput);
                fields.push(`"startTime" = $${queryIndex++}`);
                values.push(normalizedStartTime);
                changedFields.push('start time');
            }

            if (endTimeInput !== null) {
                normalizedEndTime = normalizeOptionalString(endTimeInput);
                fields.push(`"endTime" = $${queryIndex++}`);
                values.push(normalizedEndTime);
                changedFields.push('end time');
            }

            if (scheduleNoteInput !== null) {
                normalizedScheduleNote = normalizeOptionalString(scheduleNoteInput);
                fields.push(`"scheduleNote" = $${queryIndex++}`);
                values.push(normalizedScheduleNote);
                changedFields.push('schedule note');
            }

            if (scheduleTouched) {
                const existingScheduleResult = await db.query<{
                    scheduleMode: string | null;
                    weeklyDay: string | null;
                    startTime: string | null;
                    endTime: string | null;
                }>('SELECT "scheduleMode", "weeklyDay", "startTime", "endTime" FROM "Course" WHERE id = $1', [courseId]);

                if (existingScheduleResult.rows.length === 0) {
                    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
                }

                const existingSchedule = existingScheduleResult.rows[0];
                const effectiveScheduleMode = normalizedScheduleMode ?? (existingSchedule.scheduleMode === 'WEEKLY' ? 'WEEKLY' : 'RECORDED');
                const effectiveWeeklyDay = weeklyDayInput !== null ? normalizedWeeklyDay : existingSchedule.weeklyDay;
                const effectiveStartTime = normalizeTimeForComparison(startTimeInput !== null ? normalizedStartTime : existingSchedule.startTime);
                const effectiveEndTime = normalizeTimeForComparison(endTimeInput !== null ? normalizedEndTime : existingSchedule.endTime);

                if (effectiveScheduleMode === 'WEEKLY') {
                    if (!effectiveWeeklyDay || !VALID_WEEK_DAYS.includes(effectiveWeeklyDay as typeof VALID_WEEK_DAYS[number])) {
                        return NextResponse.json({ error: 'A valid weekly day is required for weekly schedules.' }, { status: 400 });
                    }

                    if (!effectiveStartTime || !TIME_24H_REGEX.test(effectiveStartTime) || !effectiveEndTime || !TIME_24H_REGEX.test(effectiveEndTime)) {
                        return NextResponse.json({ error: 'Start and end times must use HH:MM format.' }, { status: 400 });
                    }

                    if (effectiveStartTime >= effectiveEndTime) {
                        return NextResponse.json({ error: 'End time must be later than start time.' }, { status: 400 });
                    }
                }

                if (effectiveScheduleMode === 'RECORDED') {
                    if (weeklyDayInput === null) {
                        fields.push('"weeklyDay" = NULL');
                    }
                    if (startTimeInput === null) {
                        fields.push('"startTime" = NULL');
                    }
                    if (endTimeInput === null) {
                        fields.push('"endTime" = NULL');
                    }
                }
            }
        }

    const imageFile = formData.get('image') as File | null;
    const removeImage = formData.get('removeImage') as string | null;
        if (imageFile) {
            try {
                assertFile(imageFile, IMAGE_5MB, 'image');
            } catch (e) {
                const message = e instanceof Error ? e.message : 'Invalid file';
                return NextResponse.json({ error: message }, { status: 400 });
            }
            const oldImageResult = await db.query('SELECT "imageUrl" FROM "Course" WHERE id = $1', [courseId]);
            if (oldImageResult.rows.length > 0 && oldImageResult.rows[0].imageUrl) {
                try { await removeUploadByUrl(oldImageResult.rows[0].imageUrl); } catch (e) { console.error("Failed to delete old image:", e); }
            }
            const { publicPath: newImageUrl } = await saveUploadFile(imageFile, 'posters');
            fields.push(`"imageUrl" = $${queryIndex++}`);
            values.push(newImageUrl);
            changedFields.push('poster');
        } else if (removeImage) {
            // Remove existing image without replacement
            const existing = await db.query('SELECT "imageUrl" FROM "Course" WHERE id = $1', [courseId]);
            if (existing.rows.length > 0 && existing.rows[0].imageUrl) {
                try { await removeUploadByUrl(existing.rows[0].imageUrl); } catch (e) { console.error("Failed to delete old image:", e); }
            }
            fields.push('"imageUrl" = NULL');
            changedFields.push('poster');
        }

        if (fields.length === 0) {
            return NextResponse.json({ error: "No fields to update provided." }, { status: 400 });
        }

        const sql = `
            UPDATE "Course"
            SET ${fields.join(', ')}, "updatedAt" = CURRENT_TIMESTAMP
            WHERE id = $${queryIndex}
            RETURNING *;
        `;
        values.push(courseId);
        
        const result = await db.query(sql, values);
        if (result.rows.length === 0) return NextResponse.json({ error: "Course not found" }, { status: 404 });
        
        const updatedCourse = result.rows[0];
        updatedCourse.price = parseFloat(updatedCourse.price);

        try {
            const recipientResult = await db.query<{ email: string | null }>(
                `
                SELECT DISTINCT u.email
                FROM "User" u
                LEFT JOIN "Payment" p ON p."studentId" = u.id
                WHERE u.email IS NOT NULL
                  AND (
                                        u.role = ANY($1)
                    OR u.id = $2
                    OR (p."courseId" = $3 AND p.status = 'APPROVED')
                  )
                `,
                                [[Role.ADMIN, Role.INSTRUCTOR], updatedCourse.createdById, courseId]
            );
            const recipients = recipientResult.rows
                .map((row) => row.email)
                .filter((email): email is string => Boolean(email));

            if (recipients.length) {
                const highlights = changedFields.length
                    ? `Updated fields: ${changedFields.join(', ')}.`
                    : 'Course details were updated.';
                await sendCourseUpdatedEmail(recipients, {
                    courseTitle: updatedCourse.title,
                    highlights,
                    courseId,
                });
            }
        } catch (emailError) {
            console.error('Course update email failed:', emailError);
        }

        return NextResponse.json(updatedCourse);
    } catch (error) {
        console.error("Update Course Error:", error);
        return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
    }
}


// --- NEW: DELETE function ---
export async function DELETE(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
    try {
        await ensureCourseVisibilityColumn();

        const user = await getServerUser([Role.ADMIN, Role.INSTRUCTOR]);
        const { courseId } = await params;
        if (user.role === Role.INSTRUCTOR) {
            const ownerCheck = await db.query('SELECT "createdById" FROM "Course" WHERE id = $1', [courseId]);
            if (ownerCheck.rows.length === 0) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
            if (ownerCheck.rows[0].createdById !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 1. Find the course to get its image URL before deleting the DB record
        const findResult = await db.query('SELECT "imageUrl" FROM "Course" WHERE id = $1', [courseId]);
        if (findResult.rows.length === 0) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }
        const imageUrl = findResult.rows[0].imageUrl;

        // 2. Delete the course record from the database.
        // ON DELETE CASCADE will handle all related quizzes, recordings, payments, etc.
        await db.query('DELETE FROM "Course" WHERE id = $1', [courseId]);

        // 3. If an image existed, delete the physical file from the server
        if (imageUrl) {
            try {
                await removeUploadByUrl(imageUrl);
            } catch (fileError) {
                console.error("Failed to delete course poster file, but DB record was removed:", fileError);
            }
        }
        
        // 4. Respond with a success status
        return new NextResponse(null, { status: 204 }); // 204 No Content is standard for successful deletion
    } catch (error) {
        console.error("Delete Course Error:", error);
        return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
    }
}