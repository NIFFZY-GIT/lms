import 'server-only';

import { db } from '@/lib/db';
import { ensureCourseVisibilityColumn, hasCourseVisibilityColumn } from '@/lib/course-visibility';
import type { Course } from '@/types';

type CourseRow = Omit<Course, 'price'> & { price: string | number };

export async function getPublicCourses(): Promise<Course[]> {
  try {
    await ensureCourseVisibilityColumn();
    const hasVisibilityColumn = await hasCourseVisibilityColumn();

    const query = hasVisibilityColumn
      ? 'SELECT * FROM "Course" WHERE "isHidden" = FALSE ORDER BY "createdAt" DESC'
      : 'SELECT * FROM "Course" ORDER BY "createdAt" DESC';

    const result = await db.query<CourseRow>(query);
    return result.rows.map((course) => ({
      ...course,
      price: typeof course.price === 'number' ? course.price : parseFloat(course.price),
    }));
  } catch (error) {
    console.error('[getPublicCourses] Failed to load courses:', error);
    return [];
  }
}
