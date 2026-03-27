
import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
  locales: ['en', 'si'],
  defaultLocale: 'si'
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const buildLoginRedirect = (locale: string) => {
    const url = request.nextUrl.clone();
    const callbackUrl = `${pathname}${request.nextUrl.search}`;
    url.pathname = `/${locale}/auth/login`;
    url.search = `callbackUrl=${encodeURIComponent(callbackUrl)}`;
    return NextResponse.redirect(url);
  };

  const roleDefaultPath = (role: string | undefined, locale: string) => {
    if (role === 'ADMIN') return `/${locale}/dashboard/admin`;
    if (role === 'INSTRUCTOR') return `/${locale}/dashboard/instructor`;
    return `/${locale}/dashboard/student/courses`;
  };

  const decodeRoleFromToken = (token: string | undefined): string | undefined => {
    if (!token) return undefined;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return undefined;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const payload = JSON.parse(atob(padded)) as { role?: string };
      return payload.role;
    } catch {
      return undefined;
    }
  };

  // Redirect /dashboard/... and /auth/... to /en/... if not already locale-prefixed
  if (/^\/(?:dashboard|auth)\/.*/.test(pathname) && !/^\/(en|si)\//.test(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/en${pathname}`;
    return NextResponse.redirect(url);
  }

  const localeMatch = pathname.match(/^\/(en|si)(\/|$)/);
  if (localeMatch) {
    const locale = localeMatch[1];
    const token = request.cookies.get('token')?.value;
    const role = decodeRoleFromToken(token);

    const routeChecks: Array<{ prefix: string; allowedRoles: string[] }> = [
      { prefix: `/${locale}/dashboard/admin`, allowedRoles: ['ADMIN'] },
      { prefix: `/${locale}/dashboard/instructor`, allowedRoles: ['INSTRUCTOR'] },
      { prefix: `/${locale}/dashboard/student`, allowedRoles: ['STUDENT', 'ADMIN'] },
    ];

    const matched = routeChecks.find((r) => pathname.startsWith(r.prefix));
    if (matched) {
      if (!token || !role) {
        return buildLoginRedirect(locale);
      }
      if (!matched.allowedRoles.includes(role)) {
        const url = request.nextUrl.clone();
        url.pathname = roleDefaultPath(role, locale);
        url.search = '';
        return NextResponse.redirect(url);
      }
    }
  }

  // Run intl middleware for locale routing
  return intlMiddleware(request);
}

export const config = {
  // Skip API, Next internals and file assets to reduce middleware overhead.
  matcher: ['/((?!api|_next|favicon.ico|uploads/|.*\\..*).*)'],
};
