import { db } from '@/lib/db';

let ensureClassReminderLogTablePromise: Promise<void> | null = null;

export async function ensureClassReminderLogTable(): Promise<void> {
  if (!ensureClassReminderLogTablePromise) {
    ensureClassReminderLogTablePromise = (async () => {
      try {
        await db.query(`
          CREATE TABLE IF NOT EXISTS "ClassReminderLog" (
            id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
            "courseId" VARCHAR(36) NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
            "studentId" VARCHAR(36) NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
            "reminderKey" VARCHAR(100) NOT NULL,
            "scheduledDay" VARCHAR(20) NOT NULL,
            "scheduledTime" VARCHAR(5) NOT NULL,
            "sentAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE("courseId", "studentId", "reminderKey")
          )
        `);

        await db.query('CREATE INDEX IF NOT EXISTS idx_classreminderlog_course_student ON "ClassReminderLog"("courseId", "studentId")');
        await db.query('CREATE INDEX IF NOT EXISTS idx_classreminderlog_sent_at ON "ClassReminderLog"("sentAt" DESC)');
      } catch (error) {
        console.warn('[ensureClassReminderLogTable] Unable to run schema update:', error);
      } finally {
        ensureClassReminderLogTablePromise = null;
      }
    })();
  }

  await ensureClassReminderLogTablePromise;
}
