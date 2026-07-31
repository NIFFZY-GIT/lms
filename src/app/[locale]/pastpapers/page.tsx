import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { AdSenseBanner } from '@/components/ui/AdSenseBanner';
import { fetchPastPapersTree } from '@/lib/pastpapers';
import { FileDown, Eye, GraduationCap, BookOpen, FileText, Sparkles, Filter, X, Calendar, Globe, Layers, AlertTriangle } from 'lucide-react';

type SearchParams = { grade?: string; subject?: string; term?: string; year?: string; medium?: string };

// One hue per facet, so a filter button and the matching chip on a paper always
// agree. Colour tracks the facet, never the row's position in the list.
const FACET = {
  grade:   { on: 'bg-violet-600 text-white',  off: 'bg-violet-50 text-violet-700 hover:bg-violet-100',    chip: 'bg-violet-100 text-violet-700',   count: 'text-violet-200',  countOff: 'text-violet-500' },
  subject: { on: 'bg-blue-600 text-white',    off: 'bg-blue-50 text-blue-700 hover:bg-blue-100',          chip: 'bg-blue-100 text-blue-700',       count: 'text-blue-200',    countOff: 'text-blue-500' },
  term:    { on: 'bg-rose-600 text-white',    off: 'bg-rose-50 text-rose-700 hover:bg-rose-100',          chip: 'bg-rose-100 text-rose-700',       count: 'text-rose-200',    countOff: 'text-rose-500' },
  year:    { on: 'bg-emerald-600 text-white', off: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', chip: 'bg-emerald-100 text-emerald-700', count: 'text-emerald-200', countOff: 'text-emerald-500' },
  medium:  { on: 'bg-amber-500 text-white',   off: 'bg-amber-50 text-amber-700 hover:bg-amber-100',       chip: 'bg-amber-100 text-amber-800',     count: 'text-amber-100',   countOff: 'text-amber-600' },
} as const;

const facetButton = (isActive: boolean, facet: keyof typeof FACET) =>
  `inline-flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
    isActive ? FACET[facet].on : FACET[facet].off
  }`;

export default async function PastPapersPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const adSlot = process.env.NEXT_PUBLIC_ADSENSE_IN_CONTENT_SLOT ?? '';

  let data;
  try {
    data = await fetchPastPapersTree();
  } catch (err) {
    console.error('[PastPapersPage] Failed to load past papers from DB:', err);
    return (
      <main className="min-h-[70vh] flex items-center bg-white">
        <Container className="w-full py-20">
          <div className="mx-auto max-w-lg rounded-3xl bg-white p-16 text-center shadow-xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <p className="text-xl font-semibold text-slate-900">Could not load past papers</p>
            <p className="mt-2 text-slate-500">There was a problem fetching the data. Please try again shortly.</p>
          </div>
        </Container>
      </main>
    );
  }

  const grades = data.grades
    .map(g => ({
      ...g,
      subjects: g.subjects.filter(s => s.papers.length > 0),
    }))
    .filter(g => g.subjects.length > 0);

  const selectedGrade = sp.grade ? grades.find(g => g.id === sp.grade) : undefined;
  const selectedSubject =
    selectedGrade && sp.subject
      ? selectedGrade.subjects.find(s => s.id === sp.subject)
      : undefined;

  // Get all papers based on current filter level
  const getAllPapers = () => {
    if (selectedSubject) {
      return selectedSubject.papers.map(p => ({
        ...p,
        gradeName: selectedGrade!.name,
        subjectName: selectedSubject.name,
      }));
    }
    if (selectedGrade) {
      return selectedGrade.subjects.flatMap(s =>
        s.papers.map(p => ({
          ...p,
          gradeName: selectedGrade.name,
          subjectName: s.name,
        }))
      );
    }
    return grades.flatMap(g =>
      g.subjects.flatMap(s =>
        s.papers.map(p => ({
          ...p,
          gradeName: g.name,
          subjectName: s.name,
        }))
      )
    );
  };

  const allPapers = getAllPapers();

  // Get unique values for filters
  const uniqueTerms = [...new Set(allPapers.map(p => p.term).filter(Boolean))].sort();
  const uniqueYears = [...new Set(allPapers.map(p => p.year).filter(Boolean))].sort((a, b) => (b ?? 0) - (a ?? 0));
  const uniqueMediums = [...new Set(allPapers.map(p => p.medium).filter(Boolean))].sort();

  // Apply filters
  const filteredPapers = allPapers
    .filter(p => !sp.term || p.term === sp.term)
    .filter(p => !sp.year || String(p.year) === sp.year)
    .filter(p => !sp.medium || p.medium === sp.medium)
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0));

  // Build URL helper
  const buildUrl = (params: Partial<SearchParams>) => {
    const merged = { ...sp, ...params };
    Object.keys(merged).forEach(key => {
      if (merged[key as keyof SearchParams] === undefined || merged[key as keyof SearchParams] === null) {
        delete merged[key as keyof SearchParams];
      }
    });
    const query = new URLSearchParams(merged as Record<string, string>).toString();
    return query ? `?${query}` : '?';
  };

  const clearFilterUrl = (key: keyof SearchParams) => {
    const newParams = { ...sp };
    delete newParams[key];
    const query = new URLSearchParams(newParams as Record<string, string>).toString();
    return query ? `?${query}` : '?';
  };

  const hasAnyFilter = sp.grade || sp.subject || sp.term || sp.year || sp.medium;

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero
        eyebrow="Past Papers Library"
        eyebrowIcon={Sparkles}
        title="Past papers"
        subtitle="Browse and download past examination papers by grade, subject, term, year and medium."
      />

      <Container className="py-12 md:py-16">
        <AdSenseBanner slot={adSlot} className="mx-auto mb-8 max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" />

        {grades.length === 0 ? (
          <div className="landing-card mx-auto max-w-lg p-16 text-center">
            <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-100">
              <BookOpen className="h-8 w-8" />
            </span>
            <p className="mt-5 font-display text-2xl font-bold text-slate-900">No past papers available</p>
            <p className="landing-sub mt-2">Check back soon for updates.</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
            {/* Left Sidebar - Filters */}
            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
              <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Filter className="h-5 w-5 text-blue-600" />
                Filters
              </div>

              {hasAnyFilter && (
                <a
                  href="?"
                  className="mt-3 inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                >
                  Clear all filters
                  <X className="h-3 w-3" />
                </a>
              )}

              {/* Grade Filter */}
              <div className="mt-6">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  <GraduationCap className="h-4 w-4" />
                  Grade
                </h3>
                <div className="mt-3 flex flex-col gap-2">
                  {grades.map(grade => {
                    const paperCount = grade.subjects.reduce((sum, s) => sum + s.papers.length, 0);
                    return (
                      <a
                        key={grade.id}
                        href={sp.grade === grade.id ? clearFilterUrl('grade') : buildUrl({ grade: grade.id, subject: undefined })}
                        className={facetButton(sp.grade === grade.id, 'grade')}
                      >
                        <span className="truncate">{grade.name}</span>
                        <span className={`text-xs ${sp.grade === grade.id ? FACET.grade.count : FACET.grade.countOff}`}>
                          {paperCount}
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Subject Filter */}
              {selectedGrade && (
                <div className="mt-6">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    <BookOpen className="h-4 w-4" />
                    Subject
                  </h3>
                  <div className="mt-3 flex flex-col gap-2">
                    {selectedGrade.subjects.map(subject => (
                      <a
                        key={subject.id}
                        href={sp.subject === subject.id
                          ? buildUrl({ subject: undefined })
                          : buildUrl({ subject: subject.id })
                        }
                        className={facetButton(sp.subject === subject.id, 'subject')}
                      >
                        <span className="truncate">{subject.name}</span>
                        <span className={`text-xs ${sp.subject === subject.id ? FACET.subject.count : FACET.subject.countOff}`}>
                          {subject.papers.length}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Term Filter */}
              {uniqueTerms.length > 0 && (
                <div className="mt-6">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    <Layers className="h-4 w-4" />
                    Term
                  </h3>
                  <div className="mt-3 flex flex-col gap-2">
                    {uniqueTerms.map(t => (
                      <a
                        key={t}
                        href={sp.term === t
                          ? clearFilterUrl('term')
                          : buildUrl({ term: t })
                        }
                        className={facetButton(sp.term === t, 'term')}
                      >
                        {t}
                        {sp.term === t && <X className="h-3.5 w-3.5" />}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Year Filter */}
              {uniqueYears.length > 0 && (
                <div className="mt-6">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    <Calendar className="h-4 w-4" />
                    Year
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {uniqueYears.map(year => (
                      <a
                        key={year}
                        href={sp.year === String(year)
                          ? clearFilterUrl('year')
                          : buildUrl({ year: String(year) })
                        }
                        className={facetButton(sp.year === String(year), 'year')}
                      >
                        {year}
                        {sp.year === String(year) && <X className="h-3.5 w-3.5" />}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Medium Filter */}
              {uniqueMediums.length > 0 && (
                <div className="mt-6">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    <Globe className="h-4 w-4" />
                    Medium
                  </h3>
                  <div className="mt-3 flex flex-col gap-2">
                    {uniqueMediums.map(medium => (
                      <a
                        key={medium}
                        href={sp.medium === medium
                          ? clearFilterUrl('medium')
                          : buildUrl({ medium: medium! })
                        }
                        className={facetButton(sp.medium === medium, 'medium')}
                      >
                        {medium}
                        {sp.medium === medium && <X className="h-3.5 w-3.5" />}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Results count */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Showing <span className="font-bold text-slate-900">{filteredPapers.length}</span> of{' '}
                  <span className="font-bold text-slate-900">{allPapers.length}</span> papers
                </p>
              </div>
            </aside>

            {/* Right Side - Papers */}
            <div>
              {filteredPapers.length === 0 ? (
                <div className="landing-card p-12 text-center">
                  <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <FileText className="h-8 w-8" />
                  </span>
                  <p className="mt-5 font-display text-xl font-bold text-slate-900">No papers match your filters</p>
                  <p className="landing-sub mt-2">Try adjusting your filters or clear them.</p>
                  <a
                    href="?"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
                  >
                    Clear filters
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPapers.map((paper) => (
                    <div
                      key={paper.id}
                      className="landing-card flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6"
                    >
                      {/* Single brand tile — the icon colour carried no meaning when it
                          cycled through a palette by list position. */}
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
                        <FileText className="h-7 w-7" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold leading-snug text-slate-900">{paper.title}</h3>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${FACET.grade.chip}`}>
                            {paper.gradeName}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${FACET.subject.chip}`}>
                            {paper.subjectName}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${FACET.term.chip}`}>
                            {paper.term}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${FACET.year.chip}`}>
                            {paper.year}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${FACET.medium.chip}`}>
                            {paper.medium}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-3">
                        <a
                          href={paper.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </a>
                        <a
                          href={`${paper.fileUrl}?download=1`}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition hover:brightness-110"
                        >
                          <FileDown className="h-4 w-4" />
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
