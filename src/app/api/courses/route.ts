import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getServerUser } from '../../../lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '../../../types';
import { IMAGE_5MB, assertFile } from '@/lib/security';
import { saveUploadFile } from '@/lib/uploads';
import { ensureCourseVisibilityColumn, hasCourseVisibilityColumn } from '@/lib/course-visibility';
import { ensureCourseScheduleColumns, hasCourseScheduleColumns } from '@/lib/course-schedule';
import { sendCoursePublishedEmail } from '@/lib/notify';

const VALID_WEEK_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
const TIME_24H_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const normalizeOptionalString = (value: FormDataEntryValue | null): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

// GET handler (no changes needed)
export async function GET(req: Request) {
  try {
    await ensureCourseVisibilityColumn();
    const hasVisibilityColumn = await hasCourseVisibilityColumn();

    const { searchParams } = new URL(req.url);
    const mine = searchParams.get('mine');
    let rows;
    if (mine === '1') {
      // attempt to get user (admin or instructor). If fails, return unauthorized.
      try {
      const user = await getServerUser([Role.ADMIN, Role.INSTRUCTOR]);
        const result = await db.query('SELECT * FROM "Course" WHERE "createdById" = $1 ORDER BY "createdAt" DESC', [user.id]);
        rows = result.rows;
      } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      try {
        await getServerUser(Role.ADMIN);
        const result = await db.query('SELECT * FROM "Course" ORDER BY "createdAt" DESC');
        rows = result.rows;
      } catch {
        const result = await db.query(
          hasVisibilityColumn
            ? 'SELECT * FROM "Course" WHERE "isHidden" = FALSE ORDER BY "createdAt" DESC'
            : 'SELECT * FROM "Course" ORDER BY "createdAt" DESC'
        );
        rows = result.rows;
      }
    }
    const courses = rows.map(course => ({
      ...course,
      price: parseFloat(course.price),
    }));
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

// POST handler (UPDATED to handle file uploads and course types)
export async function POST(req: Request) {
  try {
  await ensureCourseVisibilityColumn();
  await ensureCourseScheduleColumns();
  const scheduleColumnsReady = await hasCourseScheduleColumns();
  const user = await getServerUser([Role.ADMIN, Role.INSTRUCTOR]);
    const formData = await req.formData();

    // Get text fields from FormData
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const tutor = formData.get('tutor') as string | null;
    const whatsappGroupLink = formData.get('whatsappGroupLink') as string | null;
    const subject = normalizeOptionalString(formData.get('subject'));
    const grade = normalizeOptionalString(formData.get('grade'));
    const medium = normalizeOptionalString(formData.get('medium'));
    const courseType = (formData.get('courseType') as string) || 'ONE_TIME_PURCHASE';

    let scheduleMode: 'WEEKLY' | 'RECORDED' = 'RECORDED';
    let weeklyDay: string | null = null;
    let startTime: string | null = null;
    let endTime: string | null = null;
    let scheduleNote: string | null = null;

    if (scheduleColumnsReady) {
      const scheduleModeRaw = (formData.get('scheduleMode') as string | null)?.toUpperCase();
      scheduleMode = scheduleModeRaw === 'WEEKLY' ? 'WEEKLY' : 'RECORDED';
      weeklyDay = normalizeOptionalString(formData.get('weeklyDay'))?.toUpperCase() ?? null;
      startTime = normalizeOptionalString(formData.get('startTime'));
      endTime = normalizeOptionalString(formData.get('endTime'));
      scheduleNote = normalizeOptionalString(formData.get('scheduleNote'));

      if (scheduleMode === 'WEEKLY') {
        if (!weeklyDay || !VALID_WEEK_DAYS.includes(weeklyDay as typeof VALID_WEEK_DAYS[number])) {
          return NextResponse.json({ error: 'A valid weekly day is required for weekly schedules.' }, { status: 400 });
        }

        if (!startTime || !TIME_24H_REGEX.test(startTime) || !endTime || !TIME_24H_REGEX.test(endTime)) {
          return NextResponse.json({ error: 'Start and end times must use HH:MM format.' }, { status: 400 });
        }

        if (startTime >= endTime) {
          return NextResponse.json({ error: 'End time must be later than start time.' }, { status: 400 });
        }
      } else {
        weeklyDay = null;
        startTime = null;
        endTime = null;
      }
    }
    
    // Get the optional image file
  const imageFile = formData.get('image') as File | null;

    if (!title || !description || isNaN(price)) {
        return NextResponse.json({ error: 'Title, description, and price are required.' }, { status: 400 });
    }

    let imageUrl: string | null = null;
  if (imageFile) {
        // validate and save the file to the server
        try {
          assertFile(imageFile, IMAGE_5MB, 'image');
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Invalid file';
          return NextResponse.json({ error: message }, { status: 400 });
        }
    const { publicPath } = await saveUploadFile(imageFile, 'posters');
    imageUrl = publicPath;
    }

    const courseId = uuidv4();
    const sql = scheduleColumnsReady
      ? `
      INSERT INTO "Course" (
        id, title, description, "createdById", price, tutor, "whatsappGroupLink", "imageUrl", "courseType", subject, grade, medium,
        "scheduleMode", "weeklyDay", "startTime", "endTime", "scheduleNote"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *;`
      : `
      INSERT INTO "Course" (id, title, description, "createdById", price, tutor, "whatsappGroupLink", "imageUrl", "courseType", subject, grade, medium)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *;`;
    const params = scheduleColumnsReady
      ? [courseId, title, description, user.id, price, tutor, whatsappGroupLink, imageUrl, courseType, subject, grade, medium, scheduleMode, weeklyDay, startTime, endTime, scheduleNote]
      : [courseId, title, description, user.id, price, tutor, whatsappGroupLink, imageUrl, courseType, subject, grade, medium];
    const result = await db.query(sql, params);
    
    const newCourse = result.rows[0];
    newCourse.price = parseFloat(newCourse.price);

    try {
      const recipientResult = await db.query<{ email: string | null }>(
        'SELECT email FROM "User" WHERE role = ANY($1) AND email IS NOT NULL',
        [[Role.ADMIN, Role.INSTRUCTOR, Role.STUDENT]]
      );
      const recipients = recipientResult.rows
        .map((row) => row.email)
        .filter((email): email is string => Boolean(email));

      if (recipients.length) {
        await sendCoursePublishedEmail(recipients, {
          courseTitle: newCourse.title,
          description: newCourse.description,
          courseId,
        });
      }
    } catch (emailError) {
      console.error('Course publish email failed:', emailError);
    }
    
    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    console.error('Course creation error:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}