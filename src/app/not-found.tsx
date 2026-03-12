import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { SearchX, Home, Library } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <Container className="py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/si" className="text-lg font-bold text-slate-900">Online Thakshilawa</Link>
            <nav className="flex items-center gap-5 text-sm font-semibold text-slate-600">
              <Link href="/si" className="hover:text-slate-900">Home</Link>
              <Link href="/si/courses" className="hover:text-slate-900">Courses</Link>
              <Link href="/si/pastpapers" className="hover:text-slate-900">Past Papers</Link>
            </nav>
          </div>
        </Container>
      </header>

      <main className="min-h-[70vh] flex items-center">
        <Container className="w-full py-20">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <SearchX className="h-8 w-8" aria-hidden />
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Page not found
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/si" className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-base font-semibold">
                <Home className="h-5 w-5" />
                Back to Home
              </Link>
              <Link
                href="/si/courses"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Library className="h-5 w-5" />
                Browse Courses
              </Link>
            </div>
          </div>
        </div>
        </Container>
      </main>
    </div>
  );
}
