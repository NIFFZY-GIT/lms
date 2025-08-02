import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ referenceNumber: string }> }) {
  try {
    // await getServerUser(Role.ADMIN); // Protect the route
    const { referenceNumber } = await params;

    const sqlQuery = `
      SELECT 
        p.id, 
        p."receiptUrl", 
        p.status, 
        p."createdAt",
        u.name as "studentName",
        u.email as "studentEmail",
        c.title as "courseTitle"
      FROM "Payment" p
      JOIN "User" u ON p."studentId" = u.id
      JOIN "Course" c ON p."courseId" = c.id
      WHERE p."referenceNumber" = $1;
    `;
    const values = [referenceNumber];
    
    const result = await db.query(sqlQuery, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
  }
}