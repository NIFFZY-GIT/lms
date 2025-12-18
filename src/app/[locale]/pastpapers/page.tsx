import { Container } from '@/components/ui/Container';
import { fetchPastPapersTree } from '@/lib/pastpapers';
import { FileDown, Eye, ChevronRight, GraduationCap, BookOpen, FileText, Sparkles, Filter, X, Calendar, Globe } from 'lucide-react';

type SearchParams = { grade?: string; subject?: string; year?: string; medium?: string };

const paperColors = ['bg-cyan-500', 'bg-green-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500', 'bg-teal-500'];

export default async function PastPapersPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const data = await fetchPastPapersTree();

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
  const uniqueYears = [...new Set(allPapers.map(p => p.year).filter(Boolean))].sort((a, b) => (b ?? 0) - (a ?? 0));
  const uniqueMediums = [...new Set(allPapers.map(p => p.medium).filter(Boolean))].sort();

  // Apply year/medium filters
  const filteredPapers = allPapers
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

  const hasAnyFilter = sp.grade || sp.subject || sp.year || sp.medium;

  return (
    <div className="min-h-screen bg-slate-50">
      <Container className="py-12 md:py-20">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">
            <Sparkles className="h-4 w-4" />
            Past Papers Library
          </div>
          <h1 className="mt-4 text-4xl font-bold text-slate-900 md:text-5xl">Past Papers</h1>
          <p className="mt-3 text-lg text-slate-600">Browse and download past examination papers</p>
        </div>

        {grades.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-3xl bg-white p-16 text-center shadow-xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-violet-100">
              <BookOpen className="h-10 w-10 text-violet-600" />
            </div>
            <p className="text-xl font-semibold text-slate-900">No past papers available</p>
            <p className="mt-2 text-slate-500">Check back soon for updates.</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
            {/* Left Sidebar - Filters */}
            <aside className="rounded-2xl bg-white p-6 shadow-lg h-fit lg:sticky lg:top-8">
              <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Filter className="h-5 w-5 text-violet-600" />
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
                        className={`inline-flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                          sp.grade === grade.id
                            ? 'bg-violet-600 text-white'
                            : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
                        }`}
                      >
                        <span className="truncate">{grade.name}</span>
                        <span className={`text-xs ${sp.grade === grade.id ? 'text-violet-200' : 'text-violet-500'}`}>
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
                        className={`inline-flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                          sp.subject === subject.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        <span className="truncate">{subject.name}</span>
                        <span className={`text-xs ${sp.subject === subject.id ? 'text-blue-200' : 'text-blue-500'}`}>
                          {subject.papers.length}
                        </span>
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
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                          sp.year === String(year)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
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
                        className={`inline-flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                          sp.medium === medium
                            ? 'bg-orange-600 text-white'
                            : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                        }`}
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
                <div className="rounded-2xl bg-white p-12 text-center shadow-lg">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-lg font-semibold text-slate-900">No papers match your filters</p>
                  <p className="mt-2 text-slate-500">Try adjusting your filters or clear them.</p>
                  <a
                    href="?"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
                  >
                    Clear filters
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPapers.map((paper, idx) => (
                    <div
                      key={paper.id}
                      className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-lg transition-shadow hover:shadow-xl sm:flex-row sm:items-center"
                    >
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${paperColors[idx % paperColors.length]} text-white shadow-lg`}>
                        <FileText className="h-7 w-7" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-slate-900">{paper.title}</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                            {paper.gradeName}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            {paper.subjectName}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {paper.year}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                            {paper.medium}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-3">
                        <a
                          href={paper.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </a>
                        <a
                          href={`${paper.fileUrl}?download=1`}
                          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-violet-700"
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
