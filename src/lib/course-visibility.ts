import 'server-only';

import { db } from '@/lib/db';

let ensureCourseVisibilityColumnPromise: Promise<void> | null = null;
let hasCourseVisibilityColumnPromise: Promise<boolean> | null = null;

type ExistsRow = { exists: boolean };

export async function hasCourseVisibilityColumn(): Promise<boolean> {
  if (!hasCourseVisibilityColumnPromise) {
    hasCourseVisibilityColumnPromise = (async () => {
      try {
        const result = await db.query<ExistsRow>(
          `SELECT EXISTS (
             SELECT 1
             FROM information_schema.columns
             WHERE table_schema = 'public'
               AND table_name = 'Course'
               AND column_name = 'isHidden'
           ) AS "exists"`
        );

        return Boolean(result.rows[0]?.exists);
      } catch (error) {
        console.error('[hasCourseVisibilityColumn] Failed to inspect schema:', error);
        return false;
      }
    })();
  }

  return hasCourseVisibilityColumnPromise;
}

export async function ensureCourseVisibilityColumn(): Promise<void> {
  if (!ensureCourseVisibilityColumnPromise) {
    ensureCourseVisibilityColumnPromise = (async () => {
      const exists = await hasCourseVisibilityColumn();
      if (exists) {
        return;
      }

      try {
        await db.query('ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "isHidden" BOOLEAN NOT NULL DEFAULT FALSE');
        await db.query('CREATE INDEX IF NOT EXISTS idx_course_is_hidden ON "Course"("isHidden")');
        hasCourseVisibilityColumnPromise = Promise.resolve(true);
      } catch (error) {
        // Some production DB users cannot run DDL; continue gracefully.
        console.warn('[ensureCourseVisibilityColumn] Unable to run schema update:', error);
      }
    })().catch((error) => {
      ensureCourseVisibilityColumnPromise = null;
      throw error;
    });
  }

  await ensureCourseVisibilityColumnPromise;
}