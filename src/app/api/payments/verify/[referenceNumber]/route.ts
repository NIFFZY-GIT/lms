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

    const sanitizedRef = referenceNumber.trim();

    // --- THIS IS THE UPDATED SQL QUERY ---
    // It now selects u.phone and u.address from the User table.
    const sql = `
      SELECT 
        p.id as "paymentId", 
        p.status,
        p."updatedAt" as "processedAt",
        u.id as "studentId",
        u.name as "studentName",
        u.email as "studentEmail",
        u.phone as "studentPhone",      -- <-- ADDED
        u.address as "studentAddress",  -- <-- ADDED
        c.title as "courseTitle"
      FROM "Payment" p
      JOIN "User" u ON p."studentId" = u.id
      JOIN "Course" c ON p."courseId" = c.id
      WHERE p."referenceNumber" = $1;
    `;
    
    const result = await db.query(sql, [sanitizedRef]);

    if (result.rows.length > 0) {
      return NextResponse.json({ isDuplicate: true, payment: result.rows[0] });
    } else {
      return NextResponse.json({ isDuplicate: false });
    }

  } catch (error) {
    console.error("Reference check error:", error);
    return NextResponse.json({ error: 'Failed to verify reference number' }, { status: 500 });
  }
}