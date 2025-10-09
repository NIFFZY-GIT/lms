import { NextResponse, NextRequest } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role, StudentCourseInfo } from '../../../../types';

export async function GET(req: NextRequest) {
  try {
    await getServerUser(Role.ADMIN);
    const { searchParams } = new URL(req.url);
    const searchTerm = searchParams.get('search')?.toLowerCase() || '';
    const courseIdFilter = searchParams.get('courseId') || null;

    const sql = `
      WITH StudentCourses AS (
        SELECT
          p."studentId",
          json_agg(json_build_object(
            'courseId', c.id,
            'courseTitle', c.title,
            'enrollmentStatus', p.status,
            'highestScore', (
              SELECT MAX(score)
              FROM "QuizAttempt" qa
              JOIN "Quiz" q ON qa."quizId" = q.id
              WHERE qa."studentId" = p."studentId" AND q."courseId" = c.id
            )
          )) AS courses
        FROM "Payment" p
        JOIN "Course" c ON p."courseId" = c.id
        GROUP BY p."studentId"
      )
      SELECT
        u.id, u.name, u.email, u.phone, u.address, u.role, u."createdAt",
        COALESCE(sc.courses, '[]'::json) AS courses
      FROM "User" u
      LEFT JOIN StudentCourses sc ON u.id = sc."studentId"
      WHERE
        u.role = 'STUDENT' AND
        (
          LOWER(u.name) LIKE $1 OR
          LOWER(u.email) LIKE $1 OR
          u.phone LIKE $1 OR
          LOWER(u.address) LIKE $1
        ) AND
        ($2::varchar IS NULL OR u.id IN (
            SELECT "studentId" FROM "Payment" WHERE "courseId" = $2::varchar
        ))
      ORDER BY u."createdAt" DESC;
    `;
    
    const result = await db.query(sql, [`%${searchTerm}%`, courseIdFilter]);

    // --- THIS IS THE CORRECTED DATA TRANSFORMATION ---
    const students = result.rows.map(student => {
      const formattedCourses = (student.courses as StudentCourseInfo[]).map(course => ({
        ...course,
        // Safely convert the score to a number.
        // String() handles null/undefined gracefully, turning them into "null" or "undefined",
        // which parseFloat correctly parses as NaN, triggering the null fallback.
        highestScore: course.highestScore ? parseFloat(String(course.highestScore)) : null,
      }));

      return {
        ...student,
        role: student.role as Role,
        courses: formattedCourses,
      };
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Fetch students error:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}