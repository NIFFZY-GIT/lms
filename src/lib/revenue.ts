// src/lib/revenue.ts
//
// Shared revenue reporting helpers for the admin dashboard.
//
// Rules used everywhere in this file:
//   • A payment counts as revenue only when its status is 'APPROVED'.
//   • The amount of a payment is the current price of its course — the app has
//     never stored a per-payment amount. Subscription courses bill monthly, so
//     each approved payment on a subscription course counts as one month of
//     that course's price.
//   • Months are calendar months in REPORT_TIMEZONE, keyed off the payment's
//     "createdAt" (the day the student submitted the receipt) — the same date
//     the admin student list already filters on.

import { db } from './db';
import { ALL_TIME, formatMonthLabel } from './month-utils';
import { APP_TIMEZONE } from './timezone';

export { formatMonthLabel };

export const REPORT_TIMEZONE = process.env.REPORT_TIMEZONE || APP_TIMEZONE;

/** A month key in `YYYY-MM` form, or `null` meaning "all time". */
export type MonthFilter = string | null;

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Current calendar month (`YYYY-MM`) in the reporting timezone. */
export function currentMonth(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: REPORT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  return `${year}-${month}`;
}

/**
 * Normalises a `?month=` query param.
 * `all` → null (all time); a valid `YYYY-MM` → itself; anything else → this month.
 */
export function parseMonthParam(raw: string | null | undefined): MonthFilter {
  if (raw === ALL_TIME) return null;
  if (raw && MONTH_PATTERN.test(raw)) return raw;
  return currentMonth();
}

// `$1` is the reporting timezone, `$2` the month key (NULL = every month).
const IN_PERIOD = `($2::text IS NULL OR to_char(p."createdAt" AT TIME ZONE $1::text, 'YYYY-MM') = $2::text)`;

export interface RevenueSummary {
  /** Revenue for the selected period. */
  periodRevenue: number;
  /** Approved payments in the selected period. */
  periodPayments: number;
  /** Distinct students with at least one approved payment in the period. */
  periodPaidStudents: number;
  /** Distinct courses that were paid for in the period. */
  periodCourses: number;
  /** Approved revenue across all time, regardless of the selected period. */
  totalRevenue: number;
  totalPaidStudents: number;
  totalPayments: number;
  pendingPayments: number;
}

export interface CourseRevenue {
  courseId: string;
  title: string;
  price: number;
  courseType: 'ONE_TIME_PURCHASE' | 'SUBSCRIPTION';
  imageUrl: string | null;
  isHidden: boolean;
  periodRevenue: number;
  periodPayments: number;
  periodPaidStudents: number;
  totalRevenue: number;
  totalPayments: number;
  totalPaidStudents: number;
  pendingPayments: number;
}

export interface PaidStudent {
  paymentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string | null;
  courseId: string;
  courseTitle: string;
  courseType: 'ONE_TIME_PURCHASE' | 'SUBSCRIPTION';
  amount: number;
  referenceNumber: string | null;
  paidAt: string;
  subscriptionExpiryDate: string | null;
}

export interface RevenueTrendPoint {
  month: string;
  label: string;
  revenue: number;
  payments: number;
  students: number;
}

/** Headline totals for the selected period plus all-time figures. */
export async function getRevenueSummary(month: MonthFilter): Promise<RevenueSummary> {
  const sql = `
    SELECT
      COALESCE(SUM(c.price) FILTER (WHERE p.status = 'APPROVED' AND ${IN_PERIOD}), 0)::float8 AS "periodRevenue",
      COUNT(p.id) FILTER (WHERE p.status = 'APPROVED' AND ${IN_PERIOD})::int AS "periodPayments",
      COUNT(DISTINCT p."studentId") FILTER (WHERE p.status = 'APPROVED' AND ${IN_PERIOD})::int AS "periodPaidStudents",
      COUNT(DISTINCT p."courseId") FILTER (WHERE p.status = 'APPROVED' AND ${IN_PERIOD})::int AS "periodCourses",
      COALESCE(SUM(c.price) FILTER (WHERE p.status = 'APPROVED'), 0)::float8 AS "totalRevenue",
      COUNT(DISTINCT p."studentId") FILTER (WHERE p.status = 'APPROVED')::int AS "totalPaidStudents",
      COUNT(p.id) FILTER (WHERE p.status = 'APPROVED')::int AS "totalPayments",
      COUNT(p.id) FILTER (WHERE p.status = 'PENDING')::int AS "pendingPayments"
    FROM "Payment" p
    JOIN "Course" c ON c.id = p."courseId";
  `;

  const result = await db.query<RevenueSummary>(sql, [REPORT_TIMEZONE, month]);
  return (
    result.rows[0] ?? {
      periodRevenue: 0,
      periodPayments: 0,
      periodPaidStudents: 0,
      periodCourses: 0,
      totalRevenue: 0,
      totalPaidStudents: 0,
      totalPayments: 0,
      pendingPayments: 0,
    }
  );
}

/** Per-course breakdown: how many students paid and how much each course earned. */
export async function getCourseRevenue(month: MonthFilter): Promise<CourseRevenue[]> {
  const sql = `
    SELECT
      c.id AS "courseId",
      c.title,
      c.price::float8 AS price,
      c."courseType",
      c."imageUrl",
      c."isHidden",
      COALESCE(SUM(c.price) FILTER (WHERE p.status = 'APPROVED' AND ${IN_PERIOD}), 0)::float8 AS "periodRevenue",
      COUNT(p.id) FILTER (WHERE p.status = 'APPROVED' AND ${IN_PERIOD})::int AS "periodPayments",
      COUNT(DISTINCT p."studentId") FILTER (WHERE p.status = 'APPROVED' AND ${IN_PERIOD})::int AS "periodPaidStudents",
      COALESCE(SUM(c.price) FILTER (WHERE p.status = 'APPROVED'), 0)::float8 AS "totalRevenue",
      COUNT(p.id) FILTER (WHERE p.status = 'APPROVED')::int AS "totalPayments",
      COUNT(DISTINCT p."studentId") FILTER (WHERE p.status = 'APPROVED')::int AS "totalPaidStudents",
      COUNT(p.id) FILTER (WHERE p.status = 'PENDING')::int AS "pendingPayments"
    FROM "Course" c
    LEFT JOIN "Payment" p ON p."courseId" = c.id
    GROUP BY c.id
    ORDER BY "periodRevenue" DESC, "totalRevenue" DESC, c.title ASC;
  `;

  const result = await db.query<CourseRevenue>(sql, [REPORT_TIMEZONE, month]);
  return result.rows;
}

/**
 * The students behind the numbers: every approved payment in the period,
 * optionally narrowed to a single course.
 */
export async function getPaidStudents(options: {
  month: MonthFilter;
  courseId?: string | null;
  limit?: number | null;
}): Promise<PaidStudent[]> {
  const { month, courseId = null, limit = null } = options;

  const sql = `
    SELECT
      p.id AS "paymentId",
      p."studentId",
      u.name AS "studentName",
      u.email AS "studentEmail",
      u.phone AS "studentPhone",
      c.id AS "courseId",
      c.title AS "courseTitle",
      c."courseType",
      c.price::float8 AS amount,
      p."referenceNumber",
      p."createdAt" AS "paidAt",
      p."subscriptionExpiryDate"
    FROM "Payment" p
    JOIN "User" u ON u.id = p."studentId"
    JOIN "Course" c ON c.id = p."courseId"
    WHERE p.status = 'APPROVED'
      AND ${IN_PERIOD}
      AND ($3::varchar IS NULL OR p."courseId" = $3::varchar)
    ORDER BY p."createdAt" DESC
    LIMIT $4::int;
  `;

  const result = await db.query<PaidStudent>(sql, [REPORT_TIMEZONE, month, courseId, limit]);
  return result.rows;
}

/** Revenue per calendar month for the last `months` months, oldest first. */
export async function getRevenueTrend(months = 12): Promise<RevenueTrendPoint[]> {
  const sql = `
    SELECT
      to_char(m, 'YYYY-MM') AS month,
      COALESCE(SUM(c.price) FILTER (WHERE p.status = 'APPROVED'), 0)::float8 AS revenue,
      COUNT(p.id) FILTER (WHERE p.status = 'APPROVED')::int AS payments,
      COUNT(DISTINCT p."studentId") FILTER (WHERE p.status = 'APPROVED')::int AS students
    FROM generate_series(
           date_trunc('month', (now() AT TIME ZONE $1::text)) - make_interval(months => $2::int - 1),
           date_trunc('month', (now() AT TIME ZONE $1::text)),
           interval '1 month'
         ) m
    LEFT JOIN "Payment" p
      ON date_trunc('month', p."createdAt" AT TIME ZONE $1::text) = m
    LEFT JOIN "Course" c ON c.id = p."courseId"
    GROUP BY m
    ORDER BY m ASC;
  `;

  const result = await db.query<Omit<RevenueTrendPoint, 'label'>>(sql, [REPORT_TIMEZONE, months]);
  return result.rows.map((row) => ({ ...row, label: formatMonthLabel(row.month) }));
}

/** Months that actually have approved payments, newest first (for month pickers). */
export async function getAvailableMonths(): Promise<string[]> {
  const sql = `
    SELECT DISTINCT to_char(p."createdAt" AT TIME ZONE $1::text, 'YYYY-MM') AS month
    FROM "Payment" p
    WHERE p.status = 'APPROVED'
    ORDER BY month DESC;
  `;

  const result = await db.query<{ month: string }>(sql, [REPORT_TIMEZONE]);
  const months = result.rows.map((row) => row.month);

  // Always offer the current month, even before its first payment lands.
  const thisMonth = currentMonth();
  return months.includes(thisMonth) ? months : [thisMonth, ...months];
}
