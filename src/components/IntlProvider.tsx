'use client';

import { NextIntlClientProvider } from 'next-intl';
import React from 'react';
import { APP_TIMEZONE } from '@/lib/timezone';

export function IntlProvider({ locale, messages, children }: { locale: string; messages: Record<string, unknown>; children: React.ReactNode }) {
  return (
    // `timeZone` must be set explicitly. Without it next-intl falls back to the
    // runtime's zone — the server's on the server, the visitor's in the browser
    // — which produces hydration mismatches for any formatted date.
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={APP_TIMEZONE}>
      {children}
    </NextIntlClientProvider>
  );
}
