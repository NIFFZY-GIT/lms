import { Container } from '@/components/ui/Container';

export default function PastPapersLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-blue-50/30 py-12">
      <Container>
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="mb-10 text-center space-y-3">
            <div className="mx-auto h-6 w-36 rounded-full bg-slate-200" />
            <div className="mx-auto h-11 w-56 rounded-lg bg-slate-200" />
            <div className="mx-auto h-5 w-72 rounded bg-slate-200" />
          </div>
          {/* Grid skeleton */}
          <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
            <div className="h-80 rounded-2xl bg-slate-200" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-slate-200" />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
