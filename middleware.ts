import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter (best-effort, per-instance)
type Bucket = { tokens: number; last: number };
const RATE_LIMIT_BUCKETS: Record<string, Bucket> = Object.create(null);
const WINDOW_MS = 60_000; // 1 minute
const MAX_TOKENS_DEFAULT = 60; // 60 req/min default
const MAX_TOKENS_LOGIN = 10; // stricter for auth endpoints

function rateLimit(key: string, max: number): boolean {
  const now = Date.now();
  const bucket = RATE_LIMIT_BUCKETS[key] ?? { tokens: max, last: now };
  const elapsed = now - bucket.last;
  // Refill tokens over time
  bucket.tokens = Math.min(max, bucket.tokens + (elapsed / WINDOW_MS) * max);
  bucket.last = now;
  if (bucket.tokens < 1) {
    RATE_LIMIT_BUCKETS[key] = bucket;
    return false;
  }
  bucket.tokens -= 1;
  RATE_LIMIT_BUCKETS[key] = bucket;
  return true;
}

function setSecurityHeaders(res: NextResponse, origin: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // dev allows eval for React refresh; tighten in prod if possible
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.headers.set('X-DNS-Prefetch-Control', 'off');
  res.headers.set('X-Download-Options', 'noopen');
  if (isProd && origin.startsWith('https:')) {
    res.headers.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains; preload');
  }
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;
  const method = req.method.toUpperCase();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';

  // Rate limiting
  const isAuthPath = pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/register');
  const bucketKey = `${ip}:${isAuthPath ? 'auth' : pathname}`;
  const ok = rateLimit(bucketKey, isAuthPath ? MAX_TOKENS_LOGIN : MAX_TOKENS_DEFAULT);
  if (!ok) {
    const tooMany = NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    setSecurityHeaders(tooMany, url.origin);
    return tooMany;
  }

  // CSRF protection for state-changing API routes: require same-origin origin/referrer
  if (pathname.startsWith('/api') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const expected = `${url.protocol}//${url.host}`;
    const sameOrigin = origin ? origin === expected : referer ? referer.startsWith(expected) : true;
    if (!sameOrigin) {
      const res = NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
      setSecurityHeaders(res, url.origin);
      return res;
    }
  }

  // Continue with request, but attach security headers to response
  const res = NextResponse.next();
  setSecurityHeaders(res, url.origin);
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|uploads/).*)',
  ],
};
