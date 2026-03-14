import { Container } from '@/components/ui/Container';
import { Course } from '@/types';
import { CourseCard } from '@/components/ui/CourseCard';
import { BookOpen, ChevronDown, Filter, Search, Sparkles, X } from 'lucide-react';
import { getPublicCourses } from '@/lib/courses';

type SearchParams = {
  subject?: string;
  grade?: string;
  medium?: string;
  q?: string;
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
  const searchTerm = sp.q?.trim() || '';

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
    .filter((course) => !selectedMedium || (course.medium || '') === selectedMedium)
    .filter((course) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        (course.tutor || '').toLowerCase().includes(q) ||
        (course.subject || '').toLowerCase().includes(q)
      );
    });

  const hasActiveFilters = Boolean(selectedSubject || selectedGrade || selectedMedium || searchTerm);
  const buildFilterHref = (updates: Partial<SearchParams>) => {
    const merged: SearchParams = {
      subject: selectedSubject,
      grade: selectedGrade,
      medium: selectedMedium,
      q: searchTerm,
      ...updates,
    };

    const params = new URLSearchParams();
    if (merged.subject) params.set('subject', merged.subject);
    if (merged.grade) params.set('grade', merged.grade);
    if (merged.medium) params.set('medium', merged.medium);
    if (merged.q) params.set('q', merged.q);

    const query = params.toString();
    return query ? `?${query}` : '?';
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ecfeff_0%,_#f8fafc_45%,_#ffffff_100%)]">
      <Container className="py-14 md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800">
            <Sparkles className="h-4 w-4" />
            Learn Smarter
          </div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Explore Courses That Match You
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 md:text-xl">
            Filter by subject, grade, and medium to find exactly what you need in seconds.
          </p>
        </div>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white/95 shadow-sm backdrop-blur">
          <details className="group [&_summary::-webkit-details-marker]:hidden" open>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 outline-none md:p-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Find Your Best Match</h2>
                <p className="text-xs text-slate-500">Search and filter courses quickly.</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-500 transition-transform duration-200 group-open:rotate-180" />
            </summary>

            <div className="px-4 pb-4 md:px-6 md:pb-6">
              <form method="GET" className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={searchTerm}
              placeholder="Search by course title, tutor, or subject"
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-28 text-sm text-slate-700 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            />
            <input type="hidden" name="subject" value={selectedSubject} />
            <input type="hidden" name="grade" value={selectedGrade} />
            <input type="hidden" name="medium" value={selectedMedium} />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700">
              Search
            </button>
              </form>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <Filter className="h-3.5 w-3.5" />
                Subject
              </h3>
              <div className="flex flex-wrap gap-2">
                <a href={buildFilterHref({ subject: '' })} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${!selectedSubject ? 'bg-cyan-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>All</a>
                {subjects.map((subject) => (
                  <a key={subject} href={buildFilterHref({ subject })} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${selectedSubject === subject ? 'bg-cyan-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>{subject}</a>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Grade</h3>
              <div className="flex flex-wrap gap-2">
                <a href={buildFilterHref({ grade: '' })} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${!selectedGrade ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>All</a>
                {grades.map((grade) => (
                  <a key={grade} href={buildFilterHref({ grade })} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${selectedGrade === grade ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>{grade}</a>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Medium</h3>
              <div className="flex flex-wrap gap-2">
                <a href={buildFilterHref({ medium: '' })} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${!selectedMedium ? 'bg-amber-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>All</a>
                {mediums.map((medium) => (
                  <a key={medium} href={buildFilterHref({ medium })} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${selectedMedium === medium ? 'bg-amber-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>{medium}</a>
                ))}
              </div>
            </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {searchTerm && <a href={buildFilterHref({ q: '' })} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">Search: {searchTerm}<X className="h-3 w-3" /></a>}
                  {selectedSubject && <a href={buildFilterHref({ subject: '' })} className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700">{selectedSubject}<X className="h-3 w-3" /></a>}
                  {selectedGrade && <a href={buildFilterHref({ grade: '' })} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">{selectedGrade}<X className="h-3 w-3" /></a>}
                  {selectedMedium && <a href={buildFilterHref({ medium: '' })} className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">{selectedMedium}<X className="h-3 w-3" /></a>}
                  <a href="?" className="ml-auto rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">Clear all</a>
                </div>
              )}
            </div>
          </details>
        </section>

        <section className="mt-7">
            <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Available Courses</h2>
              <div className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                {filteredCourses.length} course{filteredCourses.length === 1 ? '' : 's'} found
              </div>
            </div>

            {filteredCourses && filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-7 items-stretch">
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
      </Container>
    </div>
  );
}