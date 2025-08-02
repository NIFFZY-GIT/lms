'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation'; // <-- FIX: Added useRouter
import { Container } from '@/components/ui/Container';
import { Video, Mic, HelpCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Course } from '@/types';
import { EnrollmentForm } from '@/components/student/EnrollmentForm';

// --- Corrected Type Definitions ---
// The data fetched from the API for this page includes enrollment status.
interface CourseDetails extends Course {
  enrollmentStatus: 'APPROVED' | 'PENDING' | null;
}

// API fetching function now correctly typed
const fetchCourseDetails = async (courseId: string): Promise<CourseDetails> => {
  const { data } = await axios.get(`/api/courses/${courseId}`);
  return data;
};

export default function StudentCoursePage() {
  const params = useParams();
  const router = useRouter(); // <-- FIX: Initialize router
  const courseId = params.courseId as string; // <-- FIX: Use courseId, not id

  // --- FIX: useQuery is now correctly typed with CourseDetails ---
  const { data: course, isLoading, isError, error } = useQuery<CourseDetails, Error>({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourseDetails(courseId),
    enabled: !!courseId, 
  });

  if (isLoading) {
    return <div className="text-center p-10 text-lg font-semibold">Loading course...</div>;
  }

  if (isError) {
    return (
      <Container className="py-10">
        <div className="flex flex-col items-center justify-center h-64 bg-red-50 text-red-700 rounded-lg shadow-md">
            <AlertTriangle className="w-16 h-16 mb-4" />
            <h2 className="text-2xl font-bold">Access Denied or Error</h2>
            <p className="mt-2">This course may not exist, or you may not have permission to view it.</p>
            <p className="text-sm mt-1">({error.message})</p>
        </div>
      </Container>
    );
  }

  // --- Main Logic: Render based on enrollmentStatus ---
  if (course?.enrollmentStatus === 'APPROVED') {
    // --- USER IS ENROLLED AND APPROVED ---
    // Render the full course content view
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white shadow-md">
          <Container className="py-8">
              <h1 className="text-4xl font-extrabold text-gray-800">{course?.title}</h1>
              <p className="mt-2 text-lg text-gray-600">{course?.description}</p>
          </Container>
        </div>
        
        <Container className="py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Recordings Section */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-4"><Video className="w-6 h-6 mr-3 text-indigo-600" />Course Recordings</h2>
                {course.materials?.recordingUrl ? (
                  <a href={course.materials.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Watch course recordings here</a>
                ) : (
                  <p className="text-gray-500">No recordings have been added yet.</p>
                )}
              </div>
              {/* Zoom Link Section */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-4"><Mic className="w-6 h-6 mr-3 text-indigo-600" />Live Session Link</h2>
                {course.materials?.zoomLink ? (
                   <a href={course.materials.zoomLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Join the next live session on Zoom</a>
                ) : (
                  <p className="text-gray-500">The Zoom link has not been posted yet.</p>
                )}
              </div>
            </div>
            {/* Quizzes Section */}
            <aside className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-4"><HelpCircle className="w-6 h-6 mr-3 text-indigo-600" />Quizzes</h2>
                {course.quizzes && course.quizzes.length > 0 ? (
                  <ul className="space-y-3">
                    {course.quizzes.map((quiz, index) => (
                      <li key={quiz.id}>
                        <Link href={`/dashboard/student/quiz/${quiz.id}`} className="block p-4 bg-gray-100 rounded-md hover:bg-indigo-100 transition-colors">
                          <span className="font-semibold text-gray-700">Quiz {index + 1}:</span> {quiz.question.substring(0, 50)}...
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No quizzes are available for this course yet.</p>
                )}
              </div>
            </aside>
          </div>
        </Container>
      </div>
    );
  } else {
    // --- USER IS NOT ENROLLED OR PENDING ---
    // Render the enrollment view with payment options
    return (
      <Container className="py-10">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => router.back()} className="text-indigo-600 hover:underline mb-4">← Back to all courses</button>
          <div className="bg-white p-8 rounded-lg shadow-xl">
            <h1 className="text-3xl font-bold mb-2">{course?.title}</h1>
            <p className="text-2xl font-semibold text-indigo-600 mb-6">${course?.price.toFixed(2)}</p>
            <p className="text-gray-600 mb-8">{course?.description}</p>
            
            <hr className="my-8" />
            
            {course?.enrollmentStatus === 'PENDING' ? (
              <div className="text-center p-6 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                <h2 className="font-bold text-lg">Payment Submitted!</h2>
                <p>Your payment receipt is awaiting admin approval. Please check back later to access the course content.</p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold mb-4">Enroll in this Course</h2>
                <EnrollmentForm courseId={course!.id} />
              </div>
            )}
          </div>
        </div>
      </Container>
    );
  }
}