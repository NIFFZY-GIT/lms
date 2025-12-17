import 'server-only';

import { headers } from 'next/headers';

function envBaseUrl(): string | null {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.SITE_URL ||
    process.env.APP_URL ||
    null;

  if (!fromEnv) return null;

  // Normalize (no trailing slash)
  return fromEnv.replace(/\/$/, '');
}

export async function getBaseUrl(): Promise<string> {
  const fromEnv = envBaseUrl();
  if (fromEnv) return fromEnv;

  const hdrs = await headers();

  // Prefer forwarded headers when behind a proxy / load balancer
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host');
  const proto = hdrs.get('x-forwarded-proto') ?? 'http';

  if (host) return `${proto}://${host}`;

  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}
