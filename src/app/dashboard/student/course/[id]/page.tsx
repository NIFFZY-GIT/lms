// src/app/dashboard/student/course/[id]/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Video, Mic, HelpCircle, AlertTriangle } from 'lucide-react'; // <--- FIX: Import icons
import Link from 'next/link';
import { Course } from '@/types'; // Import the main Course type

// Define types for what this specific page needs
interface CourseDetails extends Course {
  // You can extend it if this page needs more specific data
}

// API fetching function for a single course
const fetchCourseDetails = async (courseId: string): Promise<Course> => {
  const { data } = await axios.get(`/api/courses/${courseId}`);
  return data;
};

export default function StudentCoursePage() {
  const params = useParams();
  const courseId = params.id as string;

 const { data: course, isLoading, isError, error } = useQuery<Course, Error>({ // <-- Use Course
    queryKey: ['course', courseId],
    queryFn: () => fetchCourseDetails(courseId),
    enabled: !!courseId, 
  });

  if (isLoading) {
    return <div className="text-center p-10">Loading course content...</div>;
  }

  if (isError) {
    return (
      <Container className="py-10">
        <div className="flex flex-col items-center justify-center h-64 bg-red-50 text-red-700 rounded-lg shadow-md">
            <AlertTriangle className="w-16 h-16 mb-4" />
            <h2 className="text-2xl font-bold">Access Denied or Error</h2>
            <p className="mt-2">You may not have access to this course, or an error occurred.</p>
            <p className="text-sm mt-1">({error.message})</p>
        </div>
      </Container>
    );
  }

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
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-4">
                <Video className="w-6 h-6 mr-3 text-indigo-600" />
                Course Recordings
              </h2>
              {course?.materials?.recordingUrl ? (
                <a href={course.materials.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                  Watch course recordings here
                </a>
              ) : (
                <p className="text-gray-500">No recordings have been added yet.</p>
              )}
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-4">
                <Mic className="w-6 h-6 mr-3 text-indigo-600" />
                Live Session Link
              </h2>
              {course?.materials?.zoomLink ? (
                 <a href={course.materials.zoomLink} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                    Join the next live session on Zoom
                </a>
              ) : (
                <p className="text-gray-500">The Zoom link has not been posted yet.</p>
              )}
            </div>
          </div>
          <aside className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-4">
                <HelpCircle className="w-6 h-6 mr-3 text-indigo-600" />
                Quizzes
              </h2>
              {course?.quizzes && course.quizzes.length > 0 ? (
                <ul className="space-y-3">
                  {course.quizzes.map((quiz, index) => (
                    <li key={quiz.id}>
                      <Link href={`/quiz/${quiz.id}`} className="block p-4 bg-gray-100 rounded-md hover:bg-indigo-100 transition-colors">
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
}