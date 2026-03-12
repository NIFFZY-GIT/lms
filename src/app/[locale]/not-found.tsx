import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { SearchX, Home, Library } from 'lucide-react';

export default function LocaleNotFound() {
  return (
    <main className="min-h-[70vh] flex items-center bg-white text-slate-800">
      <Container className="w-full py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
            <SearchX className="h-8 w-8" aria-hidden />
          </div>
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-500">404</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Page not found
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-3 text-base font-semibold text-white hover:bg-violet-700"
            >
              <Home className="h-5 w-5" />
              Back to Home
            </Link>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Library className="h-5 w-5" />
              Browse Courses
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
