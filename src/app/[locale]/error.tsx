'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[LocaleError]', error);
  }, [error]);

  return (
    <main className="min-h-[70vh] flex items-center bg-white text-slate-800">
      <Container className="w-full py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertTriangle className="h-8 w-8" aria-hidden />
          </div>
          <p className="text-sm font-semibold uppercase tracking-widest text-red-500">Error</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Something went wrong
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            An unexpected error occurred. You can try again or go back home.
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-slate-400">Error ID: {error.digest}</p>
          )}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-3 text-base font-semibold text-white hover:bg-violet-700"
            >
              <RefreshCw className="h-5 w-5" />
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Home className="h-5 w-5" />
              Back to Home
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
