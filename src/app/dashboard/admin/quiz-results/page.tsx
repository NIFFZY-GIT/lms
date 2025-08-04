'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface QuizResult {
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  totalQuizzes: number;
  correctAnswers: number;
  score: number;
}

const fetchQuizResults = async (): Promise<QuizResult[]> => {
  const { data } = await axios.get('/api/admin/quiz-results');
  return data;
};

export default function AdminQuizResultsPage() {
  const { data: results, isLoading } = useQuery<QuizResult[]>({
    queryKey: ['quizResults'],
    queryFn: fetchQuizResults,
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Student Quiz Results</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        {isLoading && <p>Loading results...</p>}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correct / Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results?.map((result, index) => (
                <tr key={`${result.studentId}-${result.courseId}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.studentName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.courseTitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">{result.score.toFixed(1)}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.correctAnswers} / {result.totalQuizzes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}