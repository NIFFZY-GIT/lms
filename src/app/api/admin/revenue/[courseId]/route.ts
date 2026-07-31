import { NextResponse, NextRequest } from 'next/server';
import { db } from '../../../../../lib/db';
import { getServerUser } from '../../../../../lib/auth';
import { Role } from '../../../../../types';
import { formatMonthLabel, getPaidStudents, parseMonthParam } from '../../../../../lib/revenue';

interface CourseRow {
  id: string;
  title: string;
  price: number;
  courseType: 'ONE_TIME_PURCHASE' | 'SUBSCRIPTION';
}

/**
 * Who paid for one course, and how much that course earned.
 *
 * GET /api/admin/revenue/:courseId?month=YYYY-MM   → that calendar month (default: current month)
 * GET /api/admin/revenue/:courseId?month=all       → all time
 */
export async function GET(req: NextRequest, props: { params: Promise<{ courseId: string }> }) {
  try {
    await getServerUser(Role.ADMIN);

    const { courseId } = await props.params;
    const { searchParams } = new URL(req.url);
    const month = parseMonthParam(searchParams.get('month'));

    const courseResult = await db.query<CourseRow>(
      `SELECT id, title, price::float8 AS price, "courseType" FROM "Course" WHERE id = $1;`,
      [courseId]
    );
    const course = courseResult.rows[0];

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const students = await getPaidStudents({ month, courseId });

    const revenue = students.reduce((sum, student) => sum + student.amount, 0);
    const uniqueStudents = new Set(students.map((student) => student.studentId)).size;

    return NextResponse.json({
      month,
      monthLabel: formatMonthLabel(month),
      course,
      students,
      totals: {
        revenue,
        payments: students.length,
        paidStudents: uniqueStudents,
      },
    });
  } catch (error) {
    console.error('Fetch course revenue error:', error);
    return NextResponse.json({ error: 'Failed to fetch course revenue' }, { status: 500 });
  }
}
