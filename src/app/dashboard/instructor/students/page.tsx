'use client';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Course { id: string; title: string; }
interface EnrolledStudent { id: string; name: string; email: string; status: string; enrolledAt: string; attempts: number; highestScore: number; averageScore: number; }

export default function InstructorStudentsPage() {
  const { data: courses, isLoading: loadingCourses } = useQuery<Course[]>({
    queryKey: ['instructor-courses-lite'],
    queryFn: async () => {
      const raw = await axios.get('/api/courses?mine=1');
      return (raw.data as { id: string; title: string }[]).map(c => ({ id: c.id, title: c.title }));
    },
  });

  const [courseId, setCourseId] = useState<string>('');

  const { data: students, isLoading: loadingStudents, refetch } = useQuery<EnrolledStudent[]>({
    queryKey: ['instructor-course-students', courseId],
    queryFn: async () => (await axios.get(`/api/instructor/courses/${courseId}/students`)).data,
    enabled: !!courseId,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Enrolled Students</h1>
          <p className="text-sm text-gray-600">Select one of your courses to view approved enrollments.</p>
        </div>
        <div className="w-full md:w-72">
          <label className="block text-sm font-medium mb-1">Course</label>
          <div className="relative">
            <select
              className="w-full border rounded px-3 py-2 appearance-none bg-white"
              value={courseId}
              onChange={e => setCourseId(e.target.value)}
              disabled={loadingCourses || !courses?.length}
            >
              <option value="">{loadingCourses ? 'Loading...' : 'Select a course'}</option>
              {courses?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {courseId && (
        <div className="bg-white shadow rounded-lg border overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h2 className="font-semibold">Students ({students?.length || 0})</h2>
            <button onClick={() => refetch()} className="text-sm text-indigo-600 hover:underline">Refresh</button>
          </div>
          <div className="hidden md:grid grid-cols-12 bg-gray-50 text-xs font-semibold text-gray-600 border-b">
            <div className="col-span-3 px-4 py-2">Student</div>
            <div className="col-span-2 px-4 py-2 text-center">Enrolled</div>
            <div className="col-span-2 px-4 py-2 text-center">Attempts</div>
            <div className="col-span-2 px-4 py-2 text-center">Highest %</div>
            <div className="col-span-2 px-4 py-2 text-center">Average %</div>
            <div className="col-span-1 px-4 py-2 text-center">Status</div>
          </div>
          <div className="divide-y">
            {loadingStudents && <p className="p-4 text-sm text-gray-500">Loading students...</p>}
            {!loadingStudents && students?.length === 0 && <p className="p-4 text-sm text-gray-500">No approved enrollments yet.</p>}
            {students?.map(raw => {
              const s = {
                ...raw,
                highestScore: typeof raw.highestScore === 'number' ? raw.highestScore : parseFloat(String(raw.highestScore || 0)) || 0,
                averageScore: typeof raw.averageScore === 'number' ? raw.averageScore : parseFloat(String(raw.averageScore || 0)) || 0,
                attempts: typeof raw.attempts === 'number' ? raw.attempts : parseInt(String(raw.attempts || 0)) || 0,
              };
              return (
              <div key={s.id} className="px-4 py-3 grid grid-cols-1 md:grid-cols-12 gap-2 text-sm">
                <div className="md:col-span-3">
                  <p className="font-medium leading-tight">{s.name || 'Unnamed Student'}</p>
                  <p className="text-xs text-gray-500 break-all">{s.email}</p>
                  <p className="md:hidden text-[10px] text-gray-400 mt-0.5">Enrolled {new Date(s.enrolledAt).toLocaleDateString()}</p>
                </div>
                <div className="hidden md:block md:col-span-2 text-center text-xs text-gray-600">{new Date(s.enrolledAt).toLocaleDateString()}</div>
                <div className="md:col-span-2 text-center font-mono text-xs">{s.attempts}</div>
                <div className="md:col-span-2 text-center font-mono text-xs">{s.highestScore.toFixed(1)}</div>
                <div className="md:col-span-2 text-center font-mono text-xs">{s.averageScore.toFixed(1)}</div>
                <div className="md:col-span-1 text-center">
                  <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-semibold tracking-wide">{s.status}</span>
                </div>
              </div>
            );})}
          </div>
        </div>
      )}
    </div>
  );
}
