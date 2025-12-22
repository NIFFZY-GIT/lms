import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerUser } from '@/lib/auth';
import { Role } from '@/types';
import { IMAGE_5MB, assertFile } from '@/lib/security';
import { saveUploadFile, removeUploadByUrl } from '@/lib/uploads';

// PATCH (update) a question and its answers
export async function PATCH(req: Request, { params }: { params: Promise<{ quizId: string; questionId: string }> }) {
    try {
        const user = await getServerUser([Role.ADMIN, Role.INSTRUCTOR]);
        const { questionId } = await params;
        // Accept multipart to support optional image update; fallback JSON
        let questionText: string | null = null;
        let answers: { id: string, answerText: string, isCorrect: boolean }[] | null = null;
        let uploadedFile: File | null = null;
        let removeImage = false;

        const contentType = req.headers.get('content-type') || '';
        if (contentType.includes('multipart/form-data')) {
            const form = await req.formData();
            questionText = (form.get('questionText') as string) ?? null;
            const answersRaw = form.get('answers') as string | null;
            answers = answersRaw ? JSON.parse(answersRaw) : null;
            uploadedFile = form.get('image') as File | null;
            removeImage = (form.get('removeImage') as string) === 'true';
        } else {
            const body = await req.json();
            questionText = body.questionText ?? null;
            answers = body.answers ?? null;
            removeImage = !!body.removeImage;
        }

        if (user.role === Role.INSTRUCTOR) {
            const ownership = await db.query(`SELECT c."createdById" FROM "Question" q JOIN "Quiz" z ON q."quizId" = z.id JOIN "Course" c ON z."courseId" = c.id WHERE q.id = $1`, [questionId]);
            if (ownership.rows.length === 0) return NextResponse.json({ error: 'Question not found' }, { status: 404 });
            if (ownership.rows[0].createdById !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const client = await db.connect();
        try {
            await client.query('BEGIN');
            let imageUrl: string | null | undefined = undefined; // undefined means no change
            if (uploadedFile) {
                try { assertFile(uploadedFile, IMAGE_5MB, 'image'); } catch (e) {
                    const message = e instanceof Error ? e.message : 'Invalid image';
                    return NextResponse.json({ error: message }, { status: 400 });
                }
                // Remove old image if exists
                const oldImageRes = await client.query('SELECT "imageUrl" FROM "Question" WHERE id = $1', [questionId]);
                if (oldImageRes.rows.length > 0 && oldImageRes.rows[0].imageUrl) {
                    try { await removeUploadByUrl(oldImageRes.rows[0].imageUrl); } catch (e) { console.error('Failed to remove old question image:', e); }
                }
                const { publicPath } = await saveUploadFile(uploadedFile, 'quizzes');
                imageUrl = publicPath;
            } else if (removeImage) {
                // remove existing image if removeImage flag set
                const oldImageRes = await client.query('SELECT "imageUrl" FROM "Question" WHERE id = $1', [questionId]);
                if (oldImageRes.rows.length > 0 && oldImageRes.rows[0].imageUrl) {
                    try { await removeUploadByUrl(oldImageRes.rows[0].imageUrl); } catch (e) { console.error('Failed to remove question image:', e); }
                }
                imageUrl = null; // explicit removal
            }

            const safeQuestionText = (questionText ?? '').toString();
            if (imageUrl !== undefined) {
                await client.query('UPDATE "Question" SET "questionText" = $1, "imageUrl" = $2 WHERE id = $3;', [safeQuestionText, imageUrl, questionId]);
            } else {
                await client.query('UPDATE "Question" SET "questionText" = $1 WHERE id = $2;', [safeQuestionText, questionId]);
            }
            if (answers && Array.isArray(answers)) {
                const updatePromises = answers.map((ans: { id: string, answerText: string, isCorrect: boolean }) => {
                    return client.query('UPDATE "Answer" SET "answerText" = $1, "isCorrect" = $2 WHERE id = $3;', [ans.answerText, ans.isCorrect, ans.id]);
                });
                await Promise.all(updatePromises);
            }
            await client.query('COMMIT');
            return NextResponse.json({ message: 'Question updated successfully' });
        } catch(e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('PATCH /api/quizzes/[quizId]/questions/[questionId] failed:', error);
        return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
    }
}

// DELETE a question (and its answers via CASCADE)
export async function DELETE(req: Request, { params }: { params: Promise<{ quizId: string; questionId: string }> }) {
  try {
    const user = await getServerUser([Role.ADMIN, Role.INSTRUCTOR]);
    const { questionId } = await params;
    if (user.role === Role.INSTRUCTOR) {
        const ownership = await db.query(`SELECT c."createdById" FROM "Question" q JOIN "Quiz" z ON q."quizId" = z.id JOIN "Course" c ON z."courseId" = c.id WHERE q.id = $1`, [questionId]);
        if (ownership.rows.length === 0) return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        if (ownership.rows[0].createdById !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await db.query('DELETE FROM "Question" WHERE id = $1', [questionId]);
    return new NextResponse(null, { status: 204 });
    } catch (error) {
    console.error('DELETE /api/quizzes/[quizId]/questions/[questionId] failed:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}