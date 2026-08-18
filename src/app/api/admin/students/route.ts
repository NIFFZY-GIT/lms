import { NextResponse, NextRequest } from 'next/server';
import { db } from '../../../../lib/db';
import { getServerUser } from '../../../../lib/auth';
import { Role, StudentCourseInfo } from '../../../../types';

interface StudentPaymentHistoryEntry {
  courseId: string;
  courseTitle: string;
  paidMonths: number[];
  unpaidMonths: number[];
  payments: Array<{
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    month: number;
    monthLabel: string;
  }>;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser([Role.ADMIN, Role.INSTRUCTOR]);
    const instructorId = user.role === Role.INSTRUCTOR ? user.id : null;
    const { searchParams } = new URL(req.url);
    const searchTerm = searchParams.get('search')?.toLowerCase() || '';
    const courseIdFilter = searchParams.get('courseId') || null;
    const monthParam = searchParams.get('month') || '';
    const parsedMonth = Number(monthParam);
    const monthFilter = Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12 ? parsedMonth : null;

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
        WHERE ($4::varchar IS NULL OR c."createdById" = $4::varchar)
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
        (
          $4::varchar IS NULL OR EXISTS (
            SELECT 1
            FROM "Payment" ip
            JOIN "Course" ic ON ip."courseId" = ic.id
            WHERE ip."studentId" = u.id
              AND ic."createdById" = $4::varchar
          )
        ) AND
        (
          ($2::varchar IS NULL AND $3::int IS NULL) OR
          EXISTS (
            SELECT 1
            FROM "Payment" fp
            JOIN "Course" fc ON fp."courseId" = fc.id
            WHERE fp."studentId" = u.id
              AND fp.status = 'APPROVED'
              AND ($2::varchar IS NULL OR fp."courseId" = $2::varchar)
              AND ($3::int IS NULL OR EXTRACT(MONTH FROM fp."createdAt") = $3::int)
              AND ($4::varchar IS NULL OR fc."createdById" = $4::varchar)
          )
        )
      ORDER BY u."createdAt" DESC;
    `;
    
    const result = await db.query(sql, [`%${searchTerm}%`, courseIdFilter, monthFilter, instructorId]);

    // --- THIS IS THE CORRECTED DATA TRANSFORMATION ---
    const students = result.rows.map(student => {
      const formattedCourses = (student.courses as StudentCourseInfo[]).map(course => ({
        ...course,
        highestScore: course.highestScore ? parseFloat(String(course.highestScore)) : null,
      }));

      return {
        ...student,
        role: student.role as Role,
        courses: formattedCourses,
      };
    });

    if (!students.length) {
      return NextResponse.json([]);
    }

    const studentIds = students.map(student => student.id);
    const paymentHistoryResult = await db.query<{
      studentId: string;
      courseId: string;
      courseTitle: string;
      status: 'PENDING' | 'APPROVED' | 'REJECTED';
      createdAt: string;
    }>(`
      SELECT p."studentId", c.id AS "courseId", c.title AS "courseTitle", p.status, p."createdAt"
      FROM "Payment" p
      JOIN "Course" c ON p."courseId" = c.id
      WHERE p."studentId" = ANY($1)
      ORDER BY p."studentId", c.title, p."createdAt" ASC
    `, [studentIds]);

    const paymentHistoryMap = new Map<string, Map<string, StudentPaymentHistoryEntry>>();

    for (const payment of paymentHistoryResult.rows) {
      if (!paymentHistoryMap.has(payment.studentId)) {
        paymentHistoryMap.set(payment.studentId, new Map());
      }

      const historyByCourse = paymentHistoryMap.get(payment.studentId)!;
      if (!historyByCourse.has(payment.courseId)) {
        historyByCourse.set(payment.courseId, {
          courseId: payment.courseId,
          courseTitle: payment.courseTitle,
          paidMonths: [],
          unpaidMonths: [],
          payments: [],
        });
      }

      const courseHistory = historyByCourse.get(payment.courseId)!;
      const paymentDate = new Date(payment.createdAt);
      const monthNumber = paymentDate.getUTCMonth() + 1;
      const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(paymentDate);

      courseHistory.payments.push({
        id: `${payment.studentId}-${payment.courseId}-${payment.createdAt}`,
        status: payment.status,
        createdAt: payment.createdAt,
        month: monthNumber,
        monthLabel,
      });
    }

    const monthNumbers = Array.from({ length: 12 }, (_, index) => index + 1);

    const studentsWithPaymentHistory = students.map(student => {
      const historyForStudent = Array.from(paymentHistoryMap.get(student.id)?.values() ?? []).map(courseHistory => {
        const paidMonthSet = new Set(
          courseHistory.payments
            .filter(payment => payment.status === 'APPROVED')
            .map(payment => payment.month)
        );

        const paidMonths = monthNumbers.filter(month => paidMonthSet.has(month));
        const unpaidMonths = monthNumbers.filter(month => !paidMonthSet.has(month));

        return {
          ...courseHistory,
          paidMonths,
          unpaidMonths,
        };
      });

      return {
        ...student,
        paymentHistory: historyForStudent,
      };
    });

    return NextResponse.json(studentsWithPaymentHistory);
  } catch (error) {
    console.error("Fetch students error:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}