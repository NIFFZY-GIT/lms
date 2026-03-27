import { db } from '@/lib/db';

let ensureCourseScheduleColumnsPromise: Promise<void> | null = null;
let hasCourseScheduleColumnsPromise: Promise<boolean> | null = null;

const REQUIRED_COLUMNS = ['scheduleMode', 'weeklyDay', 'startTime', 'endTime', 'scheduleNote'] as const;

export async function hasCourseScheduleColumns(): Promise<boolean> {
  if (!hasCourseScheduleColumnsPromise) {
    hasCourseScheduleColumnsPromise = (async () => {
      try {
        const result = await db.query<{ column_name: string }>(
          `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'Course'
              AND column_name = ANY($1)
          `,
          [REQUIRED_COLUMNS]
        );

        const present = new Set(result.rows.map((row) => row.column_name));
        return REQUIRED_COLUMNS.every((name) => present.has(name));
      } catch (error) {
        console.error('[hasCourseScheduleColumns] Failed to inspect schema:', error);
        return false;
      }
    })();
  }

  return hasCourseScheduleColumnsPromise;
}

export async function ensureCourseScheduleColumns(): Promise<void> {
  if (!ensureCourseScheduleColumnsPromise) {
    ensureCourseScheduleColumnsPromise = (async () => {
      const exists = await hasCourseScheduleColumns();
      if (exists) return;

      try {
        await db.query('ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "scheduleMode" VARCHAR(20) NOT NULL DEFAULT \'RECORDED\'');
        await db.query('ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "weeklyDay" VARCHAR(20)');
        await db.query('ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "startTime" TIME');
        await db.query('ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "endTime" TIME');
        await db.query('ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "scheduleNote" VARCHAR(255)');
        hasCourseScheduleColumnsPromise = Promise.resolve(true);
      } catch (error) {
        console.warn('[ensureCourseScheduleColumns] Unable to run schema update:', error);
      } finally {
        ensureCourseScheduleColumnsPromise = null;
      }
    })();
  }

  await ensureCourseScheduleColumnsPromise;
}
