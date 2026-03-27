import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureCourseScheduleColumns, hasCourseScheduleColumns } from '@/lib/course-schedule';
import { ensureClassReminderLogTable } from '@/lib/class-reminder-log';
import { sendClassStartingReminderEmail } from '@/lib/notify';

type ReminderCandidate = {
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  classDay: string;
  classStartTime: string;
  scheduleNote: string | null;
};

const DEFAULT_TIMEZONE = 'Asia/Colombo';

const getPartsInTimeZone = (date: Date, timeZone: string): Record<string, string> => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  return parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});
};

const toTitleCase = (value: string): string => {
  return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatTime12h = (timeValue: string): string => {
  const [hourRaw, minuteRaw] = timeValue.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return timeValue;

  const meridiem = hour >= 12 ? 'PM' : 'AM';
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:${String(minute).padStart(2, '0')} ${meridiem}`;
};

const unauthorizedResponse = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

const isAuthorized = (req: Request): boolean => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.slice('Bearer '.length).trim();
  return token === secret;
};

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return unauthorizedResponse();
  }

  try {
    await ensureCourseScheduleColumns();
    await ensureClassReminderLogTable();
    const hasSchedule = await hasCourseScheduleColumns();

    if (!hasSchedule) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: 'Course schedule columns not available',
      });
    }

    const timeZone = process.env.CLASS_SCHEDULE_TIMEZONE || DEFAULT_TIMEZONE;
    const now = new Date();
    const targetDate = new Date(now.getTime() + 5 * 60 * 1000);
    const targetParts = getPartsInTimeZone(targetDate, timeZone);

    const dayUpper = (targetParts.weekday || '').toUpperCase();
    const targetTime = `${targetParts.hour || '00'}:${targetParts.minute || '00'}`;
    const targetDateKey = `${targetParts.year || '0000'}-${targetParts.month || '00'}-${targetParts.day || '00'}`;
    const reminderKey = `${targetDateKey}|${dayUpper}|${targetTime}|${timeZone}`;

    const candidatesResult = await db.query<ReminderCandidate>(
      `
      SELECT DISTINCT ON (c.id, u.id)
        c.id AS "courseId",
        c.title AS "courseTitle",
        u.id AS "studentId",
        COALESCE(u.name, 'Student') AS "studentName",
        u.email AS "studentEmail",
        c."weeklyDay" AS "classDay",
        TO_CHAR(c."startTime", 'HH24:MI') AS "classStartTime",
        c."scheduleNote" AS "scheduleNote"
      FROM "Course" c
      INNER JOIN "Payment" p ON p."courseId" = c.id
      INNER JOIN "User" u ON u.id = p."studentId"
      WHERE c."scheduleMode" = 'WEEKLY'
        AND c."weeklyDay" = $1
        AND TO_CHAR(c."startTime", 'HH24:MI') = $2
        AND p.status = 'APPROVED'
        AND u.email IS NOT NULL
        AND (
          c."courseType" <> 'SUBSCRIPTION'
          OR p."subscriptionExpiryDate" IS NULL
          OR p."subscriptionExpiryDate" >= NOW()
        )
      ORDER BY c.id, u.id, p."createdAt" DESC
      `,
      [dayUpper, targetTime]
    );

    let sent = 0;
    let skippedDuplicates = 0;
    let failed = 0;

    for (const candidate of candidatesResult.rows) {
      const logInsertResult = await db.query<{ id: string }>(
        `
        INSERT INTO "ClassReminderLog" ("courseId", "studentId", "reminderKey", "scheduledDay", "scheduledTime")
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT ("courseId", "studentId", "reminderKey") DO NOTHING
        RETURNING id
        `,
        [candidate.courseId, candidate.studentId, reminderKey, dayUpper, targetTime]
      );

      if (logInsertResult.rows.length === 0) {
        skippedDuplicates += 1;
        continue;
      }

      try {
        await sendClassStartingReminderEmail(candidate.studentEmail, {
          studentName: candidate.studentName,
          courseTitle: candidate.courseTitle,
          classDay: toTitleCase(candidate.classDay),
          classStartTime: formatTime12h(candidate.classStartTime),
          startsInMinutes: 5,
          courseId: candidate.courseId,
          scheduleNote: candidate.scheduleNote,
        });
        sent += 1;
      } catch (error) {
        failed += 1;
        const insertedLogId = logInsertResult.rows[0].id;
        try {
          await db.query('DELETE FROM "ClassReminderLog" WHERE id = $1', [insertedLogId]);
        } catch (cleanupError) {
          console.error('[class-reminders] Failed to cleanup reminder log after email failure:', cleanupError);
        }
        console.error('[class-reminders] Failed to send reminder email:', error);
      }
    }

    return NextResponse.json({
      ok: true,
      timezone: timeZone,
      day: dayUpper,
      time: targetTime,
      reminderKey,
      candidates: candidatesResult.rows.length,
      sent,
      failed,
      skippedDuplicates,
    });
  } catch (error) {
    console.error('[class-reminders] Cron execution failed:', error);
    return NextResponse.json({ error: 'Failed to process class reminders' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
