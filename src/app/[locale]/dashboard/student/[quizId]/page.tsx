'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { toast } from '@/components/ui/toast';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Answer {
  id: string;
  answer: string;
  isCorrect: boolean;
}

interface Quiz {
  id: string;
  question: string;
  answers: Answer[];
  courseId: string;
}

interface QuizSubmission {
  selectedAnswerId: string;
}

// API functions
const fetchQuiz = async (quizId: string): Promise<Quiz> => {
  const { data } = await axios.get(`/api/quiz/${quizId}`);
  return data;
};

const submitQuiz = async ({ quizId, submission }: { quizId: string; submission: QuizSubmission }) => {
  const { data } = await axios.post(`/api/quiz/${quizId}/submit`, submission);
  return data;
};

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;
  
  const [selectedAnswerId, setSelectedAnswerId] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null);

  const { data: quiz, isLoading, isError } = useQuery<Quiz>({
    queryKey: ['quiz', quizId],
    queryFn: () => fetchQuiz(quizId),
    enabled: !!quizId,
  });

  const submitMutation = useMutation({
    mutationFn: submitQuiz,
    onSuccess: (data) => {
      setIsSubmitted(true);
      setResult(data);
    },
    onError: (error: AxiosError<{ error: string }>) => {
      toast.error(error.response?.data?.error || error.message);
    },
  });

  const handleSubmit = () => {
  if (!selectedAnswerId) { toast.warning('Please select an answer before submitting.'); return; }
    
    submitMutation.mutate({
      quizId,
      submission: { selectedAnswerId },
    });
  };

  const goBack = () => {
    if (quiz?.courseId) {
      router.push(`/dashboard/student/course/${quiz.courseId}`);
    } else {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <Container className="py-10">
        <div className="text-center">Loading quiz...</div>
      </Container>
    );
  }

  if (isError || !quiz) {
    return (
      <Container className="py-10">
        <div className="text-center text-red-600">
          <h2 className="text-2xl font-bold mb-4">Quiz Not Found</h2>
          <p>The quiz you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Link 
            href="/dashboard/student" 
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={goBack}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Course
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          {!isSubmitted ? (
            <>
              <h1 className="text-2xl font-bold text-gray-800 mb-6">Quiz Question</h1>
              
              <div className="mb-8">
                <h2 className="text-lg text-gray-700 mb-4">{quiz.question}</h2>
                
                <div className="space-y-3">
                  {quiz.answers.map((answer) => (
                    <label
                      key={answer.id}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedAnswerId === answer.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={answer.id}
                        checked={selectedAnswerId === answer.id}
                        onChange={(e) => setSelectedAnswerId(e.target.value)}
                        className="mr-3 text-blue-600"
                      />
                      <span className="text-gray-700">{answer.answer}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!selectedAnswerId || submitMutation.isPending}
                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit Answer'}
              </button>
            </>
          ) : (
            <div className="text-center">
              <div className="mb-6">
                {result?.isCorrect ? (
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                ) : (
                  <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                )}
                
                <h2 className={`text-2xl font-bold mb-2 ${
                  result?.isCorrect ? 'text-green-600' : 'text-red-600'
                }`}>
                  {result?.isCorrect ? 'Correct!' : 'Incorrect'}
                </h2>
                
                {!result?.isCorrect && result?.correctAnswer && (
                  <p className="text-gray-600 mb-4">
                    The correct answer was: <strong>{result.correctAnswer}</strong>
                  </p>
                )}
              </div>

              <button
                onClick={goBack}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Course
              </button>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
