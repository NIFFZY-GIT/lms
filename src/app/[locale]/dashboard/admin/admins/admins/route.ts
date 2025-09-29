import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role } from '@/types';

export async function GET() {
  try {
    await getServerUser(Role.ADMIN);

    const sql = `
      SELECT id, name, email, "createdAt"
      FROM "User"
      WHERE role = 'ADMIN'
      ORDER BY "createdAt" DESC;
    `;
    
    const result = await db.query(sql);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Fetch admins error:", error);
    return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 });
  }
}