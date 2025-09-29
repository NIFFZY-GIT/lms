'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import Link from 'next/link';

// --- Type Definition ---
interface QuizAttempt {
  attemptId: string;
  score: number;
  attemptedAt: string;
  quizTitle: string;
  courseTitle: string;
  courseId: string;
}

// --- API Function ---
const fetchMyAttempts = async (): Promise<QuizAttempt[]> => {
  const { data } = await axios.get('/api/student/quiz-attempts');
  return data;
};

// --- Helper Skeleton Component ---
const ResultRowSkeleton = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
      <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-16"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
    </tr>
);

export default function MyResultsPage() {
  const { data: attempts, isLoading, isError } = useQuery<QuizAttempt[]>({
    queryKey: ['myQuizAttempts'],
    queryFn: fetchMyAttempts,
  });

  return (
    <div className="space-y-6 md:space-y-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Quiz Results</h1>

      {/* Desktop/tablet view */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" aria-label="Quiz results">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Attempted</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <ResultRowSkeleton key={i} />)
              ) : isError ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-red-600">Failed to load your results.</td>
                </tr>
              ) : attempts?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-500">You have not attempted any quizzes yet.</td>
                </tr>
              ) : (
                attempts?.map((attempt) => (
                  <tr key={attempt.attemptId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{attempt.quizTitle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/dashboard/student/course/${attempt.courseId}`} className="text-sm text-indigo-600 hover:underline">
                        {attempt.courseTitle}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-bold ${attempt.score >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                        {attempt.score.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(attempt.attemptedAt), 'PP')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile view: stacked cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="flex items-center justify-between">
                <div className="h-6 bg-gray-200 rounded-full w-16" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
            </div>
          ))
        ) : isError ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center text-red-600">Failed to load your results.</div>
        ) : attempts?.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-600">You have not attempted any quizzes yet.</div>
        ) : (
          attempts?.map((attempt) => (
            <div key={attempt.attemptId} className="bg-white rounded-lg shadow-sm p-4">
              <div className="font-semibold text-gray-900 mb-1 line-clamp-2">{attempt.quizTitle}</div>
              <Link
                href={`/dashboard/student/course/${attempt.courseId}`}
                className="text-sm text-indigo-600 hover:underline"
              >
                {attempt.courseTitle}
              </Link>
              <div className="mt-3 flex items-center justify-between">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${attempt.score >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {attempt.score.toFixed(0)}%
                </span>
                <span className="text-xs text-gray-500">{format(new Date(attempt.attemptedAt), 'PP')}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}