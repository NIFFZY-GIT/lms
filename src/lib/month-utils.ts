// src/lib/month-utils.ts
//
// Client-safe helpers for the `YYYY-MM` month keys used by the revenue reports.
// Kept free of any database import so client components can use them too.

/** Sentinel used by the month pickers and the `?month=` query param. */
export const ALL_TIME = 'all';

/** Human label for a month key, e.g. `2026-07` → `July 2026`. `null`/`all` → `All Time`. */
export function formatMonthLabel(month: string | null | undefined): string {
  if (!month || month === ALL_TIME) return 'All Time';

  const [year, monthNumber] = month.split('-').map(Number);
  if (!year || !monthNumber) return month;

  return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
