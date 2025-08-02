import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db'; // Correct relative path
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';

// GET handler to fetch a single course
// Add this GET function to this file
export async function GET(req: Request, { params }: { params: { courseId: string } }) {
  try {
    const user = await getServerUser(); // Gets current user
    const { courseId } = params;

    // Fetch course details
    const courseResult = await db.query('SELECT * FROM "Course" WHERE id = $1', [courseId]);
    if (courseResult.rows.length === 0) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    const course = courseResult.rows[0];
    course.price = parseFloat(course.price); // Ensure price is a number

    // Check the student's payment status for THIS course
    const paymentQuery = 'SELECT status FROM "Payment" WHERE "studentId" = $1 AND "courseId" = $2';
    const paymentResult = await db.query(paymentQuery, [user.id, courseId]);
    
    const enrollmentStatus = paymentResult.rows[0]?.status || null; // 'APPROVED', 'PENDING', or null

    // If approved, fetch materials and quizzes
    if (enrollmentStatus === 'APPROVED') {
        const materialsResult = await db.query('SELECT * FROM "CourseMaterial" WHERE "courseId" = $1', [courseId]);
        const quizzesResult = await db.query('SELECT id, question FROM "Quiz" WHERE "courseId" = $1', [courseId]);
        course.materials = materialsResult.rows[0] || null;
        course.quizzes = quizzesResult.rows;
    } else {
        course.materials = null; // Don't send materials if not approved
        course.quizzes = [];
    }
    
    return NextResponse.json({ ...course, enrollmentStatus });
  } catch (error) {
    // ... error handling
  }
}