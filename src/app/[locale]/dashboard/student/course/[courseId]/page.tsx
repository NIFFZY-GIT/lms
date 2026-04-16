'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Container } from '@/components/ui/Container';
import { Video, Mic, HelpCircle, AlertTriangle, ArrowLeft, LogOut, ExternalLink, BookOpen, FileText, Download, Clock } from 'lucide-react';
import Link from 'next/link';
import { Course, Recording, CourseTutorial } from '@/types';
import { EnrollmentForm } from '@/components/student/EnrollmentForm';
import { toast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { formatCurrency } from '@/lib/utils';

const isFileVideoUrl = (url?: string) => {
  if (!url) return false;
  return url.startsWith('/uploads/') || /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
};

const isProtectedRecordingUrl = (url?: string) => {
  if (!url) return false;
  return url.startsWith('/api/recordings/');
};

const getEmbeddedRecordingUrl = (rawUrl?: string): { provider: 'youtube' | 'zoom' | 'external'; embedUrl: string } | null => {
  if (!rawUrl) return null;
  let input = rawUrl.trim();
  if (!input) return null;

  // Accept links pasted without protocol (e.g. m.youtube.com/watch?v=...)
  if (!/^https?:\/\//i.test(input) && /^(www\.|m\.|youtu\.be|youtube\.com)/i.test(input)) {
    input = `https://${input}`;
  }

  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    const isYoutubeHost = host === 'youtu.be' || host === 'youtube.com' || host === 'm.youtube.com' || host.endsWith('.youtube.com');

    // YouTube URLs (watch, short, shorts, embed)
    if (isYoutubeHost) {
      let videoId: string | null = null;

      if (host === 'youtu.be') {
        videoId = url.pathname.split('/').filter(Boolean)[0] || null;
      } else if (url.pathname === '/watch') {
        videoId = url.searchParams.get('v');
      } else if (url.pathname.startsWith('/live/')) {
        videoId = url.pathname.split('/')[2] || null;
      } else if (url.pathname.startsWith('/shorts/')) {
        videoId = url.pathname.split('/')[2] || null;
      } else if (url.pathname.startsWith('/embed/')) {
        videoId = url.pathname.split('/')[2] || null;
      } else if (url.pathname.startsWith('/v/')) {
        videoId = url.pathname.split('/')[2] || null;
      }

      // Some YouTube URLs carry the ID in query params even on non-/watch routes.
      if (!videoId) {
        videoId = url.searchParams.get('v') || url.searchParams.get('vi');
      }

      if (videoId) {
        const cleanVideoId = videoId.replace(/[^a-zA-Z0-9_-]/g, '');
        if (!cleanVideoId) return null;

        return {
          provider: 'youtube',
          embedUrl: `https://www.youtube-nocookie.com/embed/${cleanVideoId}`,
        };
      }

      // Do not iframe raw YouTube page URLs; they are blocked by X-Frame-Options.
      return null;
    }

    // Zoom cloud recording links often contain /rec/play or /rec/share
    if (host.includes('zoom.us') && (url.pathname.includes('/rec/play') || url.pathname.includes('/rec/share'))) {
      url.searchParams.set('autoplay', 'true');
      return {
        provider: 'zoom',
        embedUrl: url.toString(),
      };
    }

    // Fallback for other providers that allow iframing
    return {
      provider: 'external',
      embedUrl: url.toString(),
    };
  } catch {
    return null;
  }
};

// --- Type Definition for this page's data ---
interface CourseDetails extends Course {
  enrollmentStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | null;
  recordings: Recording[];
  tutorials: CourseTutorial[];
  canUnenroll?: boolean;
  subscriptionExpiryDate?: string | null;
}

// --- Subscription Countdown Timer ---
function SubscriptionCountdown({ expiryDate }: { expiryDate: string }) {
  const calcTimeLeft = () => {
    const diff = new Date(expiryDate).getTime() - Date.now();
    if (diff <= 0) return null;
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calcTimeLeft);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(expiryDate).getTime() - Date.now();
      if (diff <= 0) return null;
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };
    const id = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(id);
  }, [expiryDate]);

  const expiryFormatted = new Date(expiryDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });

  if (!timeLeft) {
    return (
      <div className="w-full sm:w-auto bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800 flex-shrink-0">
        <div className="flex items-center gap-2 font-semibold"><Clock className="w-4 h-4" /> Subscription Expired</div>
        <div className="text-xs mt-1 opacity-75">Expired on {expiryFormatted}</div>
      </div>
    );
  }

  const unit = (val: number, label: string) => (
    <div className="flex flex-col items-center">
      <span className="text-xl font-bold leading-none">{String(val).padStart(2, '0')}</span>
      <span className="text-xs uppercase tracking-wide opacity-70">{label}</span>
    </div>
  );

  const isUrgent = timeLeft.days < 3;

  return (
    <div className={`w-full sm:w-auto flex-shrink-0 rounded-lg border px-4 py-3 ${
      isUrgent ? 'bg-red-50 border-red-200 text-red-800' : 'bg-amber-50 border-amber-200 text-amber-800'
    }`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-2">
        <Clock className="w-3.5 h-3.5" /> Access expires {expiryFormatted}
      </div>
      <div className="flex items-center gap-3">
        {unit(timeLeft.days, 'days')}
        <span className="text-lg font-bold opacity-50 mb-1">:</span>
        {unit(timeLeft.hours, 'hrs')}
        <span className="text-lg font-bold opacity-50 mb-1">:</span>
        {unit(timeLeft.minutes, 'min')}
        <span className="text-lg font-bold opacity-50 mb-1">:</span>
        {unit(timeLeft.seconds, 'sec')}
      </div>
    </div>
  );
}

// --- API Functions ---
const fetchCourseDetails = async (courseId: string): Promise<CourseDetails> => {
  const { data } = await axios.get(`/api/courses/${courseId}`);
  return data;
};

const unenrollFromCourse = async (courseId: string) => {
    return (await axios.delete(`/api/courses/${courseId}/unenroll`)).data;
};

export default function StudentCoursePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const courseId = params.courseId as string;

  const { data: course, isLoading, isError, error } = useQuery<CourseDetails, Error>({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourseDetails(courseId),
    enabled: !!courseId, 
  });

  // --- Mutation for unenrolling from the course ---
  const confirm = useConfirm();
  const unenrollMutation = useMutation({
    mutationFn: unenrollFromCourse,
  onSuccess: () => {
    toast.success('You have successfully unenrolled from the course.');
        // Invalidate this course's query to refetch its data.
        // This will automatically update the UI to show the enrollment form again.
        queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
    onError: (error: AxiosError<{ error?: string }>) => {
        toast.error(error.response?.data?.error || error.message || 'Failed to unenroll');
    }
  });

  const handleUnenroll = () => {
    confirm({
      title: 'Unenroll from Course',
      description: 'Are you sure you want to unenroll? You will lose access to materials and quiz history. This cannot be undone.',
      confirmText: 'Unenroll',
      destructive: true,
    }).then(ok => { if (ok) unenrollMutation.mutate(courseId); });
  };

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
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-extrabold text-gray-800">{course.title}</h1>
                <p className="mt-2 text-lg text-gray-600">{course.description}</p>
              </div>
              {/* --- SUBSCRIPTION COUNTDOWN TIMER --- */}
              {course.courseType === 'SUBSCRIPTION' && course.subscriptionExpiryDate && (
                <SubscriptionCountdown expiryDate={course.subscriptionExpiryDate} />
              )}
              {/* --- UNENROLL BUTTON --- */}
              {course.canUnenroll ? (
                <button 
                  onClick={handleUnenroll}
                  disabled={unenrollMutation.isPending}
                  className="btn-danger flex items-center flex-shrink-0 w-full sm:w-auto justify-center"
                >
                  <LogOut className="w-4 h-4 mr-2"/>
                  {unenrollMutation.isPending ? 'Unenrolling...' : 'Unenroll'}
                </button>
              ) : null}
            </div>
          </Container>
        </header>
        
        <main>
          <Container className="py-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <section className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-4"><Video className="w-6 h-6 mr-3 text-blue-600" />Course Recordings</h2>
                  {course.recordings && course.recordings.length > 0 ? (
                    <div className="space-y-6">
                        {course.recordings.map(rec => (
                            <div key={rec.id}>
                                <h3 className="font-semibold text-gray-700 mb-2">{rec.title}</h3>
                                {isFileVideoUrl(rec.videoUrl) ? (
                                  <video controls controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} className="w-full rounded-lg aspect-video bg-black">
                                      <source src={rec.videoUrl} type="video/mp4" />
                                      Your browser does not support the video tag.
                                  </video>
                                ) : isProtectedRecordingUrl(rec.videoUrl) ? (
                                  <iframe
                                    src={rec.videoUrl}
                                    title={`Protected recording - ${rec.title}`}
                                    className="w-full rounded-lg aspect-video border border-gray-200 bg-black"
                                    loading="lazy"
                                    allow="autoplay; encrypted-media; picture-in-picture"
                                    allowFullScreen
                                  />
                                ) : (
                                  (() => {
                                    const embedded = getEmbeddedRecordingUrl(rec.videoUrl);
                                    if (!embedded) {
                                      return (
                                        <div className="p-4 rounded-lg border border-blue-100 bg-blue-50">
                                          <p className="text-sm text-blue-900 mb-2">Invalid recording URL.</p>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div className="space-y-3">
                                        <div className="rounded-lg overflow-hidden border border-gray-200 bg-black aspect-video">
                                          <iframe
                                            src={embedded.embedUrl}
                                            title={`Recording player - ${rec.title}`}
                                            className="w-full h-full"
                                            loading="lazy"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                          />
                                        </div>
                                        <div className="p-3 rounded-lg border border-blue-100 bg-blue-50 text-sm text-blue-900">
                                          <p className="mb-2">
                                            {embedded.provider === 'zoom'
                                              ? 'Zoom recording is embedded below.'
                                              : embedded.provider === 'youtube'
                                                ? 'YouTube recording is embedded below.'
                                                : 'This recording link is embedded below.'}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })()
                                )}
                            </div>
                        ))}
                    </div>
                  ) : (<p className="text-gray-500">No recordings have been added yet.</p>)}
                </section>
                
                <section className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-4"><Mic className="w-6 h-6 mr-3 text-blue-600" />Live Session Link</h2>
                  {course.zoomLink ? (
                    <a
                      href={course.zoomLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Join the next live session on Zoom
                    </a>
                  ) : (
                    <p className="text-gray-500">The Zoom link has not been posted yet.</p>
                  )}
                </section>

                <section className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-4">
                    <BookOpen className="w-6 h-6 mr-3 text-indigo-600" />Course Tutorials
                  </h2>
                  {course.tutorials && course.tutorials.length > 0 ? (
                    <ul className="space-y-3">
                      {course.tutorials.map(tute => (
                        <li key={tute.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-indigo-50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-800 truncate">{tute.title}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(tute.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                              </p>
                            </div>
                          </div>
                          <a
                            href={tute.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors flex-shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Open
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No tutorials have been added yet.</p>
                  )}
                </section>

              </div>
              

<aside className="space-y-6">
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-4">
  <HelpCircle className="w-6 h-6 mr-3 text-blue-600" />
        Quizzes
    </h2>
    {course.quizzes && course.quizzes.length > 0 ? (
      <ul className="space-y-3">
        {course.quizzes.map((quiz) => ( // No need for index if we're not using "Quiz 1", "Quiz 2"
          <li key={quiz.id}>
            <Link 
                href={`/dashboard/student/quiz/${quiz.id}`} 
                className="block p-4 bg-gray-100 rounded-md hover:bg-blue-100 transition-colors font-semibold text-gray-700"
            >
              {quiz.title} {/* <-- THE FIX IS HERE */}
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
    // --- VIEW 2: USER IS NOT ENROLLED, PENDING, OR REJECTED ---
    return (
      <Container className="py-10">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => router.back()} className="flex items-center text-indigo-600 hover:underline mb-4 font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to all courses
          </button>
          <div className="bg-white p-8 rounded-lg shadow-xl">
            <h1 className="text-3xl font-bold mb-2">{course?.title}</h1>
            {course && <p className="text-2xl font-semibold text-indigo-600 mb-6">{course.price === 0 ? 'Free' : formatCurrency(course.price)}</p>}
            <p className="text-gray-600 mb-2"><strong>Tutor:</strong> {course?.tutor || 'N/A'}</p>
            <p className="text-gray-600 mb-8">{course?.description}</p>
            
            <hr className="my-8" />
            
            {course?.enrollmentStatus === 'PENDING' ? (
              <div className="text-center p-6 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                <h2 className="font-bold text-lg">Payment Submitted!</h2>
                <p>Your payment receipt is awaiting admin approval. Please check back later to access the course content.</p>
              </div>
            ) : course?.enrollmentStatus === 'REJECTED' ? (
              <div>
                <div className="p-4 mb-6 bg-red-50 text-red-800 rounded-lg border border-red-200">
                    <h2 className="font-bold text-lg">Your Previous Payment was Rejected</h2>
                    <p>An administrator has reviewed your submission and it could not be approved. Please upload a new, correct receipt below to try again.</p>
                </div>
                <h2 className="text-xl font-bold mb-4">Re-submit for Enrollment</h2>
                {course && <EnrollmentForm courseId={course.id} isFree={course.price === 0} />}
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold mb-4">Enroll in this Course</h2>
                {course && <EnrollmentForm courseId={course.id} isFree={course.price === 0} />}
              </div>
            )}
          </div>
        </div>
      </Container>
    );
  }
}