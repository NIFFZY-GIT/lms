import 'server-only';

import { db } from '@/lib/db';
import { ensureCourseVisibilityColumn } from '@/lib/course-visibility';
import type { Course } from '@/types';

type CourseRow = Omit<Course, 'price'> & { price: string | number };

export async function getPublicCourses(): Promise<Course[]> {
  try {
    await ensureCourseVisibilityColumn();

    const result = await db.query<CourseRow>('SELECT * FROM "Course" WHERE "isHidden" = FALSE ORDER BY "createdAt" DESC');
    return result.rows.map((course) => ({
      ...course,
      price: typeof course.price === 'number' ? course.price : parseFloat(course.price),
    }));
  } catch (error) {
    console.error('[getPublicCourses] Failed to load courses:', error);
    return [];
  }
}
