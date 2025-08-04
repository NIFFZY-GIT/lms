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
      
      // 1. Get all questions AND all their possible answers for this quiz
      const questionsAndAnswersQuery = `
        SELECT 
          q.id AS "questionId", 
          q."questionText", 
          a.id AS "answerId", 
          a."answerText", 
          a."isCorrect"
        FROM "Question" q
        JOIN "Answer" a ON q.id = a."questionId"
        WHERE q."quizId" = $1;
      `;
      const allDataResult = await client.query(questionsAndAnswersQuery, [quizId]);

      // 2. Organize the data into a Map for easy lookup
      const questionsMap = new Map();
      allDataResult.rows.forEach(row => {
        if (!questionsMap.has(row.questionId)) {
          questionsMap.set(row.questionId, {
            questionId: row.questionId,
            questionText: row.questionText,
            answers: [], // We will populate this
            correctAnswerId: null,
          });
        }
        const questionData = questionsMap.get(row.questionId);
        // Add every answer choice to the question's answer array
        questionData.answers.push({ id: row.answerId, answerText: row.answerText });
        // If this answer is the correct one, store its ID
        if (row.isCorrect) {
          questionData.correctAnswerId = row.answerId;
        }
      });
      
      // 3. Calculate Score
      let correctCount = 0;
      const questionIdsInSubmission = Object.keys(submission);
      questionIdsInSubmission.forEach(questionId => {
        const questionData = questionsMap.get(questionId);
        if (questionData && submission[questionId] === questionData.correctAnswerId) {
          correctCount++;
        }
      });
      
      const totalQuestions = questionsMap.size;
      const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

      // 4. Save Attempts
      const quizAttemptId = uuidv4();
      await client.query(
        'INSERT INTO "QuizAttempt" (id, "studentId", "quizId", score) VALUES ($1, $2, $3, $4)',
        [quizAttemptId, user.id, quizId, score]
      );
      // ... (Saving individual question attempts can remain the same)
      const questionAttemptPromises = questionIdsInSubmission.map(questionId => {
        const selectedAnswerId = submission[questionId];
        const isCorrect = selectedAnswerId === questionsMap.get(questionId)?.correctAnswerId;
        return client.query(
          'INSERT INTO "QuestionAttempt" (id, "quizAttemptId", "questionId", "selectedAnswerId", "isCorrect") VALUES ($1, $2, $3, $4, $5)',
          [uuidv4(), quizAttemptId, questionId, selectedAnswerId, isCorrect]
        );
      });
      await Promise.all(questionAttemptPromises);

      await client.query('COMMIT');

      // 5. --- THIS IS THE FIX ---
      // Build the detailed results payload, which now includes the answers array for each question.
      const detailedResults = Array.from(questionsMap.values()).map(q => ({
        questionId: q.questionId,
        questionText: q.questionText,
        selectedAnswerId: submission[q.questionId] || null,
        correctAnswerId: q.correctAnswerId,
        answers: q.answers, // The crucial missing piece
      }));

      // 6. Return the full payload
      return NextResponse.json({
        score: score,
        totalQuestions: totalQuestions,
        correctAnswers: correctCount,
        results: detailedResults,
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