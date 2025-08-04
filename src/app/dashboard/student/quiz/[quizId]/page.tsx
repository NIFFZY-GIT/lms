'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Check, X, ArrowLeft, RefreshCw, AlertTriangle, Lightbulb } from 'lucide-react';
import Link from 'next/link';

// --- Type Definitions ---
interface Answer { id: string; answerText: string; }
interface Question { id: string; questionText: string; answers: Answer[]; }
interface Quiz { id: string; title: string; courseId: string; questions: Question[]; }
interface QuizSubmission { [questionId: string]: string; }

interface QuizResult {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    results: {
        questionId: string;
        questionText: string;
        selectedAnswerId: string | null;
        correctAnswerId: string;
        answers: Answer[];
    }[];
}

// --- API Functions ---
const fetchQuiz = async (quizId: string): Promise<Quiz> => (await axios.get(`/api/quizzes/${quizId}`)).data;
const submitQuiz = async ({ quizId, submission }: { quizId: string; submission: QuizSubmission }): Promise<QuizResult> => (await axios.post(`/api/quizzes/${quizId}/submit`, submission)).data;

// --- Main Component ---
export default function StudentQuizPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const quizId = params.quizId as string;
  
  const [answers, setAnswers] = useState<QuizSubmission>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [view, setView] = useState<'taking' | 'result'>('taking');

  const { data: quiz, isLoading, isError, error } = useQuery<Quiz, Error>({
    queryKey: ['quiz', quizId],
    queryFn: () => fetchQuiz(quizId),
    enabled: !!quizId,
  });

  const submitMutation = useMutation({
    mutationFn: submitQuiz,
    onSuccess: (data: QuizResult) => { setResult(data); setView('result'); queryClient.invalidateQueries({ queryKey: ['myQuizAttempts'] }); },
    onError: (error: AxiosError<{ error: string }>) => { alert(`Error submitting quiz: ${error.response?.data?.error || error.message}`); },
  });

  const handleSelectAnswer = (questionId: string, answerId: string) => { setAnswers(prev => ({ ...prev, [questionId]: answerId })); };
  const handleSubmit = () => {
    if (!quiz) return;
    const totalQuestions = quiz.questions.length;
    const answeredQuestions = Object.keys(answers).length;
    if (answeredQuestions < totalQuestions) { if (!window.confirm(`You have not answered all questions. Are you sure you want to submit?`)) return; }
    submitMutation.mutate({ quizId, submission: answers });
  };
  const handleRetry = () => { setAnswers({}); setResult(null); setView('taking'); };

  if (isLoading) { return <Container><div className="text-center p-10 font-semibold">Loading Quiz...</div></Container>; }
  if (isError || !quiz) {
    return (
      <Container className="py-10">
        <div className="flex flex-col items-center justify-center h-64 bg-red-50 text-red-700 rounded-lg shadow-md">
          <AlertTriangle className="w-16 h-16 mb-4" />
          <h2 className="text-2xl font-bold">Failed to Load Quiz</h2>
          <p className="mt-2">This quiz may not exist or an error occurred.</p>
          {error && <p className="text-sm mt-1">({error.message})</p>}
          <Link href="/dashboard/student/courses" className="btn-primary mt-4">Back to Courses</Link>
        </div>
      </Container>
    );
  }

  const allQuestionsAnswered = quiz.questions.length === Object.keys(answers).length;

  if (view === 'result' && result) {
    return (
        <Container className="py-10">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-xl">
                <h1 className="text-3xl font-bold mb-2">Quiz Completed!</h1>
                <p className="text-gray-600 mb-6">Results for: <strong>{quiz.title}</strong></p>
                <div className="text-center p-6 my-8 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <p className="text-lg text-indigo-800">Your Final Score:</p>
                    <p className="text-6xl font-extrabold text-indigo-600 my-2">{result.score.toFixed(0)}%</p>
                    <p>You answered <strong>{result.correctAnswers}</strong> of <strong>{result.totalQuestions}</strong> correctly.</p>
                </div>
                <h2 className="text-2xl font-bold mb-4">Detailed Review</h2>
                <div className="space-y-6">
                    {result.results.map((res, index) => {
                        const wasCorrect = res.selectedAnswerId === res.correctAnswerId;
                        const correctAnswer = res.answers.find(a => a.id === res.correctAnswerId);
                        return (
                            <div key={res.questionId} className="border-t pt-4">
                                <h3 className="font-semibold text-lg text-gray-800">Q{index + 1}: <span className="font-normal">{res.questionText}</span></h3>
                                <div className="space-y-2 mt-3">
                                    {res.answers.map(ans => {
                                        const isSelected = res.selectedAnswerId === ans.id;
                                        const isCorrect = res.correctAnswerId === ans.id;
                                        let styles = 'border-gray-300';
                                        if (isCorrect) styles = 'bg-green-50 border-green-500 text-green-900';
                                        else if (isSelected && !isCorrect) styles = 'bg-red-50 border-red-500 text-red-900';
                                        return (
                                            // --- THE FIX IS HERE ---
                                            <div key={ans.id} className={`flex items-center p-3 border rounded-md ${styles}`}>
                                                {isCorrect ? <Check className="w-5 h-5 mr-3" /> : (isSelected ? <X className="w-5 h-5 mr-3" /> : <div className="w-5 h-5 mr-3" />)}
                                                <span className="flex-grow">{ans.answerText}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                {!wasCorrect && correctAnswer && (
                                    <div className="mt-3 p-3 bg-yellow-50 text-yellow-800 border-l-4 border-yellow-400 flex items-start">
                                        <Lightbulb className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                                        <div><span className="font-semibold">Correct Answer:</span> {correctAnswer.answerText}</div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-center space-x-4 mt-10 pt-6 border-t">
                    <button onClick={() => router.push(`/dashboard/student/course/${quiz.courseId}`)} className="btn-secondary">Back to Course</button>
                    <button onClick={handleRetry} className="btn-primary flex items-center"><RefreshCw className="w-4 h-4 mr-2" /> Retry Quiz</button>
                </div>
            </div>
        </Container>
    );
  } 
  
  return (
    <Container className="py-10">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.push(`/dashboard/student/course/${quiz.courseId}`)} className="flex items-center text-indigo-600 hover:underline mb-4 font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Course
        </button>
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{quiz.title}</h1>
          <div className="space-y-10 mt-8">
            {quiz.questions.map((question, index) => (
                <div key={question.id} className="border-t pt-6 first:border-t-0 first:pt-0">
                    <h2 className="font-semibold text-lg text-gray-800">Question {index + 1}: <span className="font-normal">{question.questionText}</span></h2>
                    <div className="space-y-3 mt-4">
                        {question.answers.map(answer => (
                            <label key={answer.id} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${answers[question.id] === answer.id ? 'bg-indigo-50 border-indigo-500' : 'hover:bg-gray-50 border-gray-300'}`}>
                                <input type="radio" name={`question-${question.id}`} checked={answers[question.id] === answer.id} onChange={() => handleSelectAnswer(question.id, answer.id)} className="h-4 w-4 text-indigo-600" />
                                <span className="ml-3 text-gray-700">{answer.answerText}</span>
                            </label>
                        ))}
                    </div>
                </div>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t">
            <button onClick={handleSubmit} disabled={!allQuestionsAnswered || submitMutation.isPending} className="btn-primary w-full text-lg py-3">
              {submitMutation.isPending ? 'Submitting...' : 'Finish & Submit Quiz'}
            </button>
            {!allQuestionsAnswered && <p className="text-center text-xs text-gray-500 mt-2">The submit button will be enabled once all questions are answered.</p>}
          </div>
        </div>
      </div>
    </Container>
  );
}