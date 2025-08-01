import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role } from '@/types';

// Delete a quiz
export async function DELETE(req: Request, { params }: { params: { quizId: string } }) {
  try {
    await getServerUser(Role.ADMIN);
    const { quizId } = params;

    // First delete all answers for this quiz
    await db.query('DELETE FROM "Answer" WHERE "quizId" = $1', [quizId]);
    
    // Then delete the quiz itself
    const quizQuery = `
      DELETE FROM "Quiz"
      WHERE id = $1
      RETURNING *;
    `;

    const result = await db.query(quizQuery, [quizId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.error('Delete quiz error:', error);
    return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 });
  }
}
