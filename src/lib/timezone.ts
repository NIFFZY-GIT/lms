// src/lib/timezone.ts
//
// The app's canonical timezone. Sri Lanka does not observe DST, so this is a
// fixed +05:30 offset.
//
// It is used in two places that must agree:
//   • next-intl, so server-rendered dates match what the browser renders
//     (without it, the server formats in the host's timezone and the client in
//     the visitor's — a hydration mismatch).
//   • revenue reporting, so a "month" means the same calendar month to the
//     admin as it does to the database.
//
// Client-safe: no server-only imports here.

export const APP_TIMEZONE = 'Asia/Colombo';
