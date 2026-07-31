import { NextResponse, NextRequest } from 'next/server';
import { getServerUser } from '../../../../lib/auth';
import { Role } from '../../../../types';
import {
  formatMonthLabel,
  getAvailableMonths,
  getCourseRevenue,
  getRevenueSummary,
  getRevenueTrend,
  getPaidStudents,
  parseMonthParam,
} from '../../../../lib/revenue';

/**
 * Revenue report for the admin dashboard.
 *
 * GET /api/admin/revenue?month=YYYY-MM   → that calendar month (default: current month)
 * GET /api/admin/revenue?month=all       → all time
 */
export async function GET(req: NextRequest) {
  try {
    await getServerUser(Role.ADMIN);

    const { searchParams } = new URL(req.url);
    const month = parseMonthParam(searchParams.get('month'));

    const [summary, courses, trend, availableMonths, paidStudents] = await Promise.all([
      getRevenueSummary(month),
      getCourseRevenue(month),
      getRevenueTrend(12),
      getAvailableMonths(),
      getPaidStudents({ month, limit: 200 }),
    ]);

    return NextResponse.json({
      month,
      monthLabel: formatMonthLabel(month),
      availableMonths,
      summary,
      courses,
      trend,
      paidStudents,
    });
  } catch (error) {
    console.error('Fetch revenue report error:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue report' }, { status: 500 });
  }
}
