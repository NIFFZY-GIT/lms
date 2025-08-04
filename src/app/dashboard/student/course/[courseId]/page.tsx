'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Video, Mic, HelpCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Course, Recording } from '@/types'; // Make sure Recording is defined in types/index.ts
import { EnrollmentForm } from '@/components/student/EnrollmentForm';

// --- Type Definition for this page's data ---
interface CourseDetails extends Course {
  enrollmentStatus: 'APPROVED' | 'PENDING' | null;
  recordings: Recording[]; // Now expects an array of recordings
}

// --- API Fetching Function ---
const fetchCourseDetails = async (courseId: string): Promise<CourseDetails> => {
  const { data } = await axios.get(`/api/courses/${courseId}`);
  return data;
};


export default function StudentCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

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
    // --- VIEW 1: USER IS ENROLLED AND APPROVED ---
    return (
      <div className="bg-gray-50 min-h-screen">
        <header className="bg-white shadow-sm">
          <Container className="py-8">
              <h1 className="text-4xl font-extrabold text-gray-800">{course.title}</h1>
              <p className="mt-2 text-lg text-gray-600">{course.description}</p>
          </Container>
        </header>
        
        <main>
          <Container className="py-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Recordings Section */}
                <section className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-4"><Video className="w-6 h-6 mr-3 text-indigo-600" />Course Recordings</h2>
                  {course.recordings && course.recordings.length > 0 ? (
                    <div className="space-y-6">
                        {course.recordings.map(rec => (
                            <div key={rec.id}>
                                <h3 className="font-semibold text-gray-700 mb-2">{rec.title}</h3>
                                <video
                                    controls
                                    controlsList="nodownload"
                                    onContextMenu={(e) => e.preventDefault()}
                                    className="w-full rounded-lg aspect-video bg-black"
                                >
                                    <source src={rec.videoUrl} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No recordings have been added yet.</p>
                  )}
                </section>
                
                {/* Zoom Link Section */}
                <section className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-4"><Mic className="w-6 h-6 mr-3 text-indigo-600" />Live Session Link</h2>
                  {course.zoomLink ? (
                     <a href={course.zoomLink} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:underline">Join the next live session on Zoom</a>
                  ) : (
                    <p className="text-gray-500">The Zoom link has not been posted yet.</p>
                  )}
                </section>
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
        </main>
      </div>
    );
  } else {
    // --- VIEW 2: USER IS NOT ENROLLED OR PENDING ---
    return (
      <Container className="py-10">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => router.back()} className="flex items-center text-indigo-600 hover:underline mb-4 font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to all courses
          </button>
          <div className="bg-white p-8 rounded-lg shadow-xl">
            <h1 className="text-3xl font-bold mb-2">{course?.title}</h1>
            {course && <p className="text-2xl font-semibold text-indigo-600 mb-6">${course.price.toFixed(2)}</p>}
            <p className="text-gray-600 mb-2"><strong>Tutor:</strong> {course?.tutor || 'N/A'}</p>
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
                {course && <EnrollmentForm courseId={course.id} />}
              </div>
            )}
          </div>
        </div>
      </Container>
    );
  }
}