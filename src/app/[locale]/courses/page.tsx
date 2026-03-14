import { Container } from '@/components/ui/Container';
import { Course } from '@/types';
import { CourseCard } from '@/components/ui/CourseCard';
import { BookOpen, ChevronDown, Filter, Sparkles, X } from 'lucide-react';
import { getPublicCourses } from '@/lib/courses';

type SearchParams = {
  subject?: string;
  grade?: string;
  medium?: string;
};

// The main page is an async Server Component
export default async function CoursesPage({
  searchParams,
  params,
}: {
  searchParams?: Promise<SearchParams>;
  params: Promise<{ locale: string }>;
}) {
  const courses: Course[] = await getPublicCourses();
  const sp = (await searchParams) ?? {};
  const { locale } = await params;

  const selectedSubject = sp.subject?.trim() || '';
  const selectedGrade = sp.grade?.trim() || '';
  const selectedMedium = sp.medium?.trim() || '';

  const subjects = [...new Set(courses.map((c) => c.subject).filter(Boolean))].sort((a, b) =>
    (a as string).localeCompare(b as string)
  ) as string[];
  const grades = [...new Set(courses.map((c) => c.grade).filter(Boolean))].sort((a, b) =>
    (a as string).localeCompare(b as string)
  ) as string[];
  const mediums = [...new Set(courses.map((c) => c.medium).filter(Boolean))].sort((a, b) =>
    (a as string).localeCompare(b as string)
  ) as string[];

  const filteredCourses = courses
    .filter((course) => !selectedSubject || (course.subject || '') === selectedSubject)
    .filter((course) => !selectedGrade || (course.grade || '') === selectedGrade)
    .filter((course) => !selectedMedium || (course.medium || '') === selectedMedium);

  const hasActiveFilters = Boolean(selectedSubject || selectedGrade || selectedMedium);
  const buildFilterHref = (updates: Partial<SearchParams>) => {
    const merged: SearchParams = {
      subject: selectedSubject,
      grade: selectedGrade,
      medium: selectedMedium,
      ...updates,
    };

    const params = new URLSearchParams();
    if (merged.subject) params.set('subject', merged.subject);
    if (merged.grade) params.set('grade', merged.grade);
    if (merged.medium) params.set('medium', merged.medium);

    const query = params.toString();
    return query ? `?${query}` : '?';
  };

  const chipRowClass = 'flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible';

  const filterContent = (
    <div className="space-y-4 border-t border-slate-100 p-4 sm:p-5">

      {hasActiveFilters && (
        <div className={chipRowClass}>
          {selectedSubject && (
            <a href={buildFilterHref({ subject: '' })} className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100">
              {selectedSubject}
              <X className="h-3 w-3" />
            </a>
          )}
          {selectedGrade && (
            <a href={buildFilterHref({ grade: '' })} className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
              {selectedGrade}
              <X className="h-3 w-3" />
            </a>
          )}
          {selectedMedium && (
            <a href={buildFilterHref({ medium: '' })} className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100">
              {selectedMedium}
              <X className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</h3>
          <div className={chipRowClass}>
            <a href={buildFilterHref({ subject: '' })} className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition sm:px-3 sm:py-1.5 sm:text-xs ${!selectedSubject ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              All
            </a>
            {subjects.map((subject) => (
              <a
                key={subject}
                href={buildFilterHref({ subject })}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition sm:px-3 sm:py-1.5 sm:text-xs ${selectedSubject === subject ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {subject}
              </a>
            ))}
          </div>
      </section>

      <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Grade</h3>
          <div className={chipRowClass}>
            <a href={buildFilterHref({ grade: '' })} className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition sm:px-3 sm:py-1.5 sm:text-xs ${!selectedGrade ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              All
            </a>
            {grades.map((grade) => (
              <a
                key={grade}
                href={buildFilterHref({ grade })}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition sm:px-3 sm:py-1.5 sm:text-xs ${selectedGrade === grade ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {grade}
              </a>
            ))}
          </div>
      </section>

      <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Medium</h3>
          <div className={chipRowClass}>
            <a href={buildFilterHref({ medium: '' })} className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition sm:px-3 sm:py-1.5 sm:text-xs ${!selectedMedium ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              All
            </a>
            {mediums.map((medium) => (
              <a
                key={medium}
                href={buildFilterHref({ medium })}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition sm:px-3 sm:py-1.5 sm:text-xs ${selectedMedium === medium ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {medium}
              </a>
            ))}
          </div>
      </section>

      <a href="?" className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
        Clear All Filters
      </a>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ecfeff_0%,_#f8fafc_45%,_#ffffff_100%)]">
      <Container className="py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800">
            <Sparkles className="h-4 w-4" />
            Learn Smarter
          </div>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Explore Courses That Match You
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 md:text-xl">
            Filter by subject, grade, and medium to find exactly what you need in seconds.
          </p>
        </div>

        <div className="mt-8 lg:hidden">
          <details className="group overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-lg [&_summary::-webkit-details-marker]:hidden" open>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 outline-none sm:p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cyan-100 p-2.5 text-cyan-700">
                  <Filter className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Find Your Best Match</h2>
                  <p className="text-xs text-slate-500">Tap to minimize or expand filters.</p>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            {filterContent}
          </details>
        </div>

        <div className="mt-8 lg:pl-[320px]">
          <aside className="hidden lg:block lg:fixed lg:left-4 lg:top-1/2 lg:-translate-y-1/2 lg:w-[300px] xl:left-8">
            <details className="group max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-cyan-100 bg-white shadow-lg [&_summary::-webkit-details-marker]:hidden" open>
              <summary className="sticky top-0 z-10 flex cursor-pointer list-none items-center justify-between gap-3 border-b border-slate-100 bg-white p-4 outline-none">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-cyan-100 p-2.5 text-cyan-700">
                    <Filter className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Find Your Best Match</h2>
                    <p className="text-xs text-slate-500">Click to minimize filters.</p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              {filterContent}
            </details>
          </aside>

          <section>
            <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Available Courses</h2>
              <div className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                {filteredCourses.length} course{filteredCourses.length === 1 ? '' : 's'} found
              </div>
            </div>

            {filteredCourses && filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-7 items-stretch">
                {filteredCourses.map(course => (
                  <CourseCard key={course.id} course={course} locale={locale} />
                ))}
              </div>
            ) : (
              <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white px-8 py-16 text-center shadow-md">
                <BookOpen className="mx-auto h-16 w-16 text-slate-300" />
                <h2 className="mt-4 text-2xl font-bold text-slate-800">
                  {hasActiveFilters ? 'No Courses Match Your Filters' : 'No Courses Available Yet'}
                </h2>
                <p className="mt-2 text-slate-500">
                  {hasActiveFilters
                    ? 'Try changing Subject, Grade, or Medium to see more results.'
                    : 'Our instructors are hard at work. Please check back soon for new course listings!'}
                </p>
                {hasActiveFilters && (
                  <a href="?" className="mt-5 inline-flex items-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700">Clear All Filters</a>
                )}
              </div>
            )}
          </section>
        </div>
      </Container>
    </div>
  );
}