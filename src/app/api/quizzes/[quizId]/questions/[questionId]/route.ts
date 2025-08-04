import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role } from '@/types';

// PATCH (update) a question and its answers
export async function PATCH(req: Request, { params }: { params: Promise<{ questionId: string }> }) {
    try {
        await getServerUser(Role.ADMIN);
        const { questionId } = await params;
        const { questionText, answers } = await req.json();

        const client = await db.connect();
        try {
            await client.query('BEGIN');
            await client.query('UPDATE "Question" SET "questionText" = $1 WHERE id = $2;', [questionText, questionId]);
            const updatePromises = answers.map((ans: { id: string, answerText: string, isCorrect: boolean }) => {
                return client.query('UPDATE "Answer" SET "answerText" = $1, "isCorrect" = $2 WHERE id = $3;', [ans.answerText, ans.isCorrect, ans.id]);
            });
            await Promise.all(updatePromises);
            await client.query('COMMIT');
            return NextResponse.json({ message: 'Question updated successfully' });
        } catch(e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
    }
}

// DELETE a question (and its answers via CASCADE)
export async function DELETE(req: Request, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    await getServerUser(Role.ADMIN);
    const { questionId } = await params;
    await db.query('DELETE FROM "Question" WHERE id = $1', [questionId]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}