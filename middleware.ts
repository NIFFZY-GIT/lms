
import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
  locales: ['en', 'si'],
  defaultLocale: 'si'
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Redirect /dashboard/... and /auth/... to /en/... if not already locale-prefixed
  if (/^\/(?:dashboard|auth)\/.*/.test(pathname) && !/^\/(en|si)\//.test(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/en${pathname}`;
    return NextResponse.redirect(url);
  }
  // Run intl middleware
  const response = intlMiddleware(request);
  
  // Add pathname header for layout to detect auth pages
  response.headers.set('x-pathname', pathname);
  
  return response;
}

export const config = {
  matcher: ['/', '/(si|en)/:path*', '/((?!api|_next/static|_next/image|favicon.ico|uploads/).*)'],
};
