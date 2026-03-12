import 'server-only';

import { db } from '@/lib/db';
import type { Course } from '@/types';

type CourseRow = Omit<Course, 'price'> & { price: string | number };

export async function getPublicCourses(): Promise<Course[]> {
  try {
    const result = await db.query<CourseRow>('SELECT * FROM "Course" ORDER BY "createdAt" DESC');
    return result.rows.map((course) => ({
      ...course,
      price: typeof course.price === 'number' ? course.price : parseFloat(course.price),
    }));
  } catch (error) {
    console.error('[getPublicCourses] Failed to load courses:', error);
    return [];
  }
}
