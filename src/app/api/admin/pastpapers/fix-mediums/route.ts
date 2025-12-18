import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    // Normalize medium values
    await db.query(`
      UPDATE "PastPaper" SET medium = 'Sinhala' WHERE LOWER(medium) IN ('sinahla', 'sinhala');
    `);
    await db.query(`
      UPDATE "PastPaper" SET medium = 'English' WHERE LOWER(medium) IN ('eng', 'english');
    `);
    await db.query(`
      UPDATE "PastPaper" SET medium = 'Tamil' WHERE LOWER(medium) IN ('tamil');
    `);

    // Get updated distinct values
    const result = await db.query(`SELECT DISTINCT medium FROM "PastPaper" ORDER BY medium`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Medium values normalized',
      mediums: result.rows.map(r => r.medium)
    });
  } catch (error) {
    console.error('Error fixing mediums:', error);
    return NextResponse.json({ error: 'Failed to fix mediums' }, { status: 500 });
  }
}
