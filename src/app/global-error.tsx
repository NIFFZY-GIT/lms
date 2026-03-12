'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#f8fafc', color: '#1e293b', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            borderBottom: '1px solid #e2e8f0',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <a href="/si" style={{ color: '#0f172a', fontWeight: 700, textDecoration: 'none', fontSize: 18 }}>
              Online Thakshilawa
            </a>
            <nav style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 14, fontWeight: 600 }}>
              <a href="/si" style={{ color: '#475569', textDecoration: 'none' }}>Home</a>
              <a href="/si/courses" style={{ color: '#475569', textDecoration: 'none' }}>Courses</a>
              <a href="/si/pastpapers" style={{ color: '#475569', textDecoration: 'none' }}>Past Papers</a>
            </nav>
          </div>
        </header>
        <div
          style={{
            minHeight: 'calc(100vh - 73px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 480 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                fontSize: 28,
              }}
            >
              ⚠️
            </div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>
              Something went wrong
            </h1>
            <p style={{ marginTop: '0.75rem', color: '#64748b', fontSize: '1rem' }}>
              A critical error occurred. Please try refreshing the page.
            </p>
            {error.digest && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                Error ID: {error.digest}
              </p>
            )}
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={reset}
                style={{
                  padding: '12px 24px',
                  background: '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
              <a
                href="/si"
                style={{
                  padding: '12px 24px',
                  background: '#fff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Back to Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
