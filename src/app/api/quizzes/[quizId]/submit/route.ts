import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { getServerUser } from '../../../../../lib/auth';
import { Role } from '../../../../../types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    const user = await getServerUser(Role.STUDENT);
    const { quizId } = await params;
    const submission: Record<string, string> = await req.json();

    if (Object.keys(submission).length === 0) {
      return NextResponse.json({ error: 'Submission cannot be empty.' }, { status: 400 });
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      // Get all questions and answers for this quiz to build the results payload
      const questionsResult = await client.query(`
        SELECT q.id as "questionId", q."questionText", a.id as "answerId", a."answerText", a."isCorrect"
        FROM "Question" q
        JOIN "Answer" a ON q.id = a."questionId"
        WHERE q."quizId" = $1;
      `, [quizId]);

      // Organize the data for easy lookup
      const questionsMap = new Map();
      questionsResult.rows.forEach(row => {
        if (!questionsMap.has(row.questionId)) {
          questionsMap.set(row.questionId, {
            questionId: row.questionId,
            questionText: row.questionText,
            answers: [],
            correctAnswerId: null,
          });
        }
        const question = questionsMap.get(row.questionId);
        question.answers.push({ answerId: row.answerId, answerText: row.answerText });
        if (row.isCorrect) {
          question.correctAnswerId = row.answerId;
        }
      });
      
      // --- Score Calculation ---
      let correctCount = 0;
      const questionIds = Object.keys(submission);
      questionIds.forEach(questionId => {
        if (submission[questionId] === questionsMap.get(questionId)?.correctAnswerId) {
          correctCount++;
        }
      });
      
      const totalQuestions = questionsMap.size;
      const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

      // --- Save Attempts ---
      const quizAttemptId = uuidv4();
      await client.query(
        'INSERT INTO "QuizAttempt" (id, "studentId", "quizId", score) VALUES ($1, $2, $3, $4)',
        [quizAttemptId, user.id, quizId, score]
      );
      // ... (Saving individual question attempts remains the same)

      await client.query('COMMIT');

      // --- NEW: Build the detailed results payload ---
      const results = Array.from(questionsMap.values()).map(q => ({
        questionId: q.questionId,
        questionText: q.questionText,
        selectedAnswerId: submission[q.questionId] || null, // Student's choice
        correctAnswerId: q.correctAnswerId, // The actual correct answer ID
        answers: q.answers, // All possible answers
      }));

      return NextResponse.json({
        score: score,
        totalQuestions: totalQuestions,
        correctAnswers: correctCount,
        results: results, // Send the detailed breakdown
      });

    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Submit quiz error:', error);
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
  }
}