import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { getServerUser } from '../../../../../lib/auth';
import { Role } from '../../../../../types';

export async function GET(req: Request, { params }: { params: Promise<{ referenceNumber: string }> }) {
  try {
    await getServerUser(Role.ADMIN);
    const { referenceNumber } = await params;

    if (!referenceNumber || referenceNumber.trim() === '') {
      return NextResponse.json({ error: 'Reference number is required.' }, { status: 400 });
    }

    // --- THIS IS THE UPDATED SQL QUERY ---
    // It now joins with the User table to get the student's ID and email.
    const sql = `
      SELECT 
        p.id as "paymentId", 
        p.status,
        p."updatedAt" as "processedAt",
        u.id as "studentId",
        u.name as "studentName",
        u.email as "studentEmail",
        c.title as "courseTitle"
      FROM "Payment" p
      JOIN "User" u ON p."studentId" = u.id
      JOIN "Course" c ON p."courseId" = c.id
      WHERE p."referenceNumber" = $1;
    `;
    
    const result = await db.query(sql, [referenceNumber.trim()]);

    if (result.rows.length > 0) {
      // A payment with this reference number was found
      return NextResponse.json({ 
        isDuplicate: true, 
        payment: result.rows[0] 
      });
    } else {
      // This reference number is unique and available
      return NextResponse.json({ isDuplicate: false });
    }

  } catch (error) {
    console.error("Reference check error:", error);
    return NextResponse.json({ error: 'Failed to verify reference number' }, { status: 500 });
  }
}