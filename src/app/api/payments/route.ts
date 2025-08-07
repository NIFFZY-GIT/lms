import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getServerUser } from '../../../lib/auth';
import { Role } from '../../../types';

export async function GET() {
  try {
    await getServerUser(Role.ADMIN);
    const sql = `
      SELECT 
        p.id, 
        p.status, 
        p."receiptUrl", 
        p."createdAt", 
        u.name as "studentName", 
        c.title as "courseTitle",
        c.id as "courseId" -- Important for query invalidation
      FROM "Payment" p
      JOIN "User" u ON p."studentId" = u.id
      JOIN "Course" c ON p."courseId" = c.id
      ORDER BY p.status ASC, p."createdAt" DESC;
    `;
    const result = await db.query(sql);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Fetch payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}