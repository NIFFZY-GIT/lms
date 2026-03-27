'use client';

import Link from 'next/link';
import { Course } from '@/types';
import Image from 'next/image';
import { BookOpen, CalendarDays, GraduationCap, Globe, UserRound } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

interface CourseCardProps {
  course: Course;
  locale?: string;
}

const formatTime12h = (timeValue?: string | null): string => {
  if (!timeValue) return '';
  const [hourRaw, minuteRaw] = timeValue.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return timeValue;

  const meridiem = hour >= 12 ? 'PM' : 'AM';
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:${String(minute).padStart(2, '0')} ${meridiem}`;
};

const getScheduleLabel = (course: Course): string => {
  if (course.scheduleMode === 'WEEKLY' && course.weeklyDay && course.startTime && course.endTime) {
    return `${course.weeklyDay}, ${formatTime12h(course.startTime)} - ${formatTime12h(course.endTime)}`;
  }

  return 'Recorded / On-demand';
};

export function CourseCard({ course, locale: localeProp }: CourseCardProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const match = pathname.match(/^\/([a-zA-Z-]+)(\/|$)/);
  const locale = localeProp || (match ? match[1] : 'en');
  const studentCoursePath = `/${locale}/dashboard/student/course/${course.id}`;
  const href = !user
    ? `/${locale}/auth/login?callbackUrl=${encodeURIComponent(studentCoursePath)}`
    : user.role === 'ADMIN'
      ? `/${locale}/dashboard/admin/courses`
      : user.role === 'INSTRUCTOR'
        ? `/${locale}/dashboard/instructor/courses`
        : studentCoursePath;

  return (
    <Link href={href} className="block h-full group">
      <article className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        <div className="relative h-52 w-full border-b border-slate-100 bg-gradient-to-br from-slate-50 to-cyan-50 lg:h-56">
          {course.imageUrl ? (
            <Image
              src={course.imageUrl}
              alt={course.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              style={{ objectFit: 'contain', padding: '10px' }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-cyan-600">
              <BookOpen className="h-14 w-14 text-cyan-100" />
            </div>
          )}

          {course.price === 0 ? (
            <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white">Free</span>
          ) : null}
        </div>

        <div className="flex h-[calc(100%-13rem)] flex-col p-5 lg:h-[calc(100%-14rem)]">
          <h3 className="line-clamp-2 text-lg font-bold leading-tight text-slate-900 transition-colors group-hover:text-cyan-700">{course.title}</h3>
          <p className="mt-2 line-clamp-3 min-h-[3.75rem] text-sm leading-relaxed text-slate-600">{course.description}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {course.subject ? <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">{course.subject}</span> : null}
            {course.grade ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <GraduationCap className="h-3 w-3" />
                {course.grade}
              </span>
            ) : null}
            {course.medium ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                <Globe className="h-3 w-3" />
                {course.medium}
              </span>
            ) : null}
          </div>

          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
            <p className="inline-flex items-center gap-1.5 text-sm text-slate-600">
              <UserRound className="h-4 w-4 text-slate-500" />
              <span>Tutor:</span>
              <span className="font-semibold text-slate-700">{course.tutor || 'N/A'}</span>
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-600">
              <CalendarDays className="h-4 w-4 text-slate-500" />
              <span>{getScheduleLabel(course)}</span>
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xl font-extrabold text-slate-900">{course.price === 0 ? 'Free' : formatCurrency(course.price)}</p>
            <span className="text-xs font-semibold text-slate-500">{course.courseType === 'SUBSCRIPTION' ? 'Subscription' : 'One-time'}</span>
          </div>

          <div className="mt-4">
            <span className="inline-flex w-full items-center justify-center rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white transition-colors group-hover:bg-cyan-700">Enroll Now</span>
          </div>
        </div>
      </article>
    </Link>
  );
}