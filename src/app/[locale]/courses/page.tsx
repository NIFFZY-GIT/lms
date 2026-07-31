import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { Course } from '@/types';
import { CourseCard } from '@/components/ui/CourseCard';
import { AdSenseBanner } from '@/components/ui/AdSenseBanner';
import { BookOpen, ChevronDown, Filter, Search, Sparkles, X } from 'lucide-react';
import { getPublicCourses } from '@/lib/courses';

// One accent per filter group, assigned in fixed order.
const FILTER_ACTIVE = {
  subject: 'bg-blue-600 text-white',
  grade: 'bg-cyan-600 text-white',
  medium: 'bg-indigo-600 text-white',
} as const;
const FILTER_CHIP = {
  subject: 'bg-blue-50 text-blue-700',
  grade: 'bg-cyan-50 text-cyan-700',
  medium: 'bg-indigo-50 text-indigo-700',
} as const;
const filterPill = (isActive: boolean, group: keyof typeof FILTER_ACTIVE) =>
  `rounded-full px-3 py-1.5 text-xs font-semibold transition ${
    isActive ? FILTER_ACTIVE[group] : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
  }`;

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
  const adSlot = process.env.NEXT_PUBLIC_ADSENSE_IN_CONTENT_SLOT ?? '';

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
    <div className="min-h-screen bg-slate-50">
      <PageHero
        eyebrow="Learn Smarter"
        eyebrowIcon={Sparkles}
        title="Explore courses that match you"
        subtitle="Filter by subject, grade, and medium to find exactly what you need in seconds."
      />

      <Container className="py-12 md:py-16">
        <AdSenseBanner slot={adSlot} className="mx-auto mb-8 max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" />

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
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
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-28 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <input type="hidden" name="subject" value={selectedSubject} />
            <input type="hidden" name="grade" value={selectedGrade} />
            <input type="hidden" name="medium" value={selectedMedium} />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110">
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
                <a href={buildFilterHref({ subject: '' })} className={filterPill(!selectedSubject, 'subject')}>All</a>
                {subjects.map((subject) => (
                  <a key={subject} href={buildFilterHref({ subject })} className={filterPill(selectedSubject === subject, 'subject')}>{subject}</a>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Grade</h3>
              <div className="flex flex-wrap gap-2">
                <a href={buildFilterHref({ grade: '' })} className={filterPill(!selectedGrade, 'grade')}>All</a>
                {grades.map((grade) => (
                  <a key={grade} href={buildFilterHref({ grade })} className={filterPill(selectedGrade === grade, 'grade')}>{grade}</a>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Medium</h3>
              <div className="flex flex-wrap gap-2">
                <a href={buildFilterHref({ medium: '' })} className={filterPill(!selectedMedium, 'medium')}>All</a>
                {mediums.map((medium) => (
                  <a key={medium} href={buildFilterHref({ medium })} className={filterPill(selectedMedium === medium, 'medium')}>{medium}</a>
                ))}
              </div>
            </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {searchTerm && <a href={buildFilterHref({ q: '' })} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">Search: {searchTerm}<X className="h-3 w-3" /></a>}
                  {selectedSubject && <a href={buildFilterHref({ subject: '' })} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${FILTER_CHIP.subject}`}>{selectedSubject}<X className="h-3 w-3" /></a>}
                  {selectedGrade && <a href={buildFilterHref({ grade: '' })} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${FILTER_CHIP.grade}`}>{selectedGrade}<X className="h-3 w-3" /></a>}
                  {selectedMedium && <a href={buildFilterHref({ medium: '' })} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${FILTER_CHIP.medium}`}>{selectedMedium}<X className="h-3 w-3" /></a>}
                  <a href="?" className="ml-auto rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">Clear all</a>
                </div>
              )}
            </div>
          </details>
        </section>

        <section className="mt-7">
            <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Available Courses</h2>
              <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
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
              <div className="landing-card mx-auto max-w-xl px-8 py-16 text-center">
                <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100">
                  <BookOpen className="h-8 w-8" />
                </span>
                <h2 className="mt-5 font-display text-2xl font-bold text-slate-900">
                  {hasActiveFilters ? 'No courses match your filters' : 'No courses available yet'}
                </h2>
                <p className="landing-sub mt-2">
                  {hasActiveFilters
                    ? 'Try changing Subject, Grade, or Medium to see more results.'
                    : 'Our instructors are hard at work. Please check back soon for new course listings.'}
                </p>
                {hasActiveFilters && (
                  <a href="?" className="mt-6 inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110">Clear all filters</a>
                )}
              </div>
            )}
        </section>
      </Container>
    </div>
  );
}