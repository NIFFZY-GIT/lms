import 'server-only';

import { db } from '@/lib/db';

let ensureCourseVisibilityColumnPromise: Promise<void> | null = null;

export async function ensureCourseVisibilityColumn(): Promise<void> {
  if (!ensureCourseVisibilityColumnPromise) {
    ensureCourseVisibilityColumnPromise = (async () => {
      await db.query('ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "isHidden" BOOLEAN NOT NULL DEFAULT FALSE');
      await db.query('CREATE INDEX IF NOT EXISTS idx_course_is_hidden ON "Course"("isHidden")');
    })().catch((error) => {
      ensureCourseVisibilityColumnPromise = null;
      throw error;
    });
  }

  await ensureCourseVisibilityColumnPromise;
}