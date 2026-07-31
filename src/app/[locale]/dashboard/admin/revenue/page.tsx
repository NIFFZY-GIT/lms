'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Banknote, BookOpen, Loader2, Receipt, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ALL_TIME, formatMonthLabel } from '@/lib/month-utils';
import { CoursePayersModal, type PaidStudent } from '@/components/admin/CoursePayersModal';

// --- Types (mirror /api/admin/revenue) ---
interface CourseRevenue {
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

interface RevenueReport {
  month: string | null;
  monthLabel: string;
  availableMonths: string[];
  summary: {
    periodRevenue: number;
    periodPayments: number;
    periodPaidStudents: number;
    periodCourses: number;
    totalRevenue: number;
    totalPaidStudents: number;
    totalPayments: number;
    pendingPayments: number;
  };
  courses: CourseRevenue[];
  trend: { month: string; label: string; revenue: number; payments: number; students: number }[];
  paidStudents: PaidStudent[];
}

const fetchRevenue = async (month: string): Promise<RevenueReport> =>
  (await axios.get(`/api/admin/revenue?month=${month}`)).data;

// --- KPI tile: label above, hero number below, supporting line last ---
const StatTile = ({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
      <span className="text-blue-600">{icon}</span>
      {label}
    </div>
    <p className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 break-words">{value}</p>
    {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
  </div>
);

export default function AdminRevenuePage() {
  // '' lets the API pick the current month on the first load.
  const [month, setMonth] = useState('');
  const [payersCourse, setPayersCourse] = useState<{ id: string; title: string } | null>(null);

  const { data, isLoading, isError } = useQuery<RevenueReport>({
    queryKey: ['adminRevenue', month],
    queryFn: () => fetchRevenue(month),
  });

  const selectedMonth = month || data?.month || ALL_TIME;
  const availableMonths = data?.availableMonths ?? [];
  const periodLabel = data?.monthLabel ?? 'this month';

  if (isError) {
    return (
      <div className="text-center py-16">
        <h1 className="text-xl font-bold text-gray-800">Could not load the revenue report.</h1>
        <p className="text-gray-600 mt-2">Please refresh the page or check the server connection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header + period filter (one row above the charts) */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-800">Revenue &amp; Paid Students</h1>
          <p className="text-base text-gray-600 mt-1">
            Approved payments only, valued at each course&apos;s current price.
          </p>
        </div>
        <label className="text-sm">
          <span className="block mb-1 font-medium text-gray-700">Period</span>
          <select
            value={selectedMonth}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white min-w-[200px]"
          >
            {availableMonths.map((option) => (
              <option key={option} value={option}>{formatMonthLabel(option)}</option>
            ))}
            <option value={ALL_TIME}>All Time</option>
          </select>
        </label>
      </div>

      {isLoading || !data ? (
        <div className="flex items-center justify-center gap-2 py-24 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading revenue report...
        </div>
      ) : (
        <>
          {/* --- KPI row --- */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatTile
              label={`Revenue · ${periodLabel}`}
              value={formatCurrency(data.summary.periodRevenue)}
              sub={`${data.summary.periodPayments} approved payment${data.summary.periodPayments === 1 ? '' : 's'}`}
              icon={<Banknote className="w-5 h-5" />}
            />
            <StatTile
              label={`Students Paid · ${periodLabel}`}
              value={data.summary.periodPaidStudents}
              sub={`Across ${data.summary.periodCourses} course${data.summary.periodCourses === 1 ? '' : 's'}`}
              icon={<Users className="w-5 h-5" />}
            />
            <StatTile
              label="Pending Approvals"
              value={data.summary.pendingPayments}
              sub="Awaiting your review"
              icon={<Receipt className="w-5 h-5" />}
            />
            <StatTile
              label="All-Time Revenue"
              value={formatCurrency(data.summary.totalRevenue)}
              sub={`${data.summary.totalPaidStudents} students have ever paid`}
              icon={<BookOpen className="w-5 h-5" />}
            />
          </div>

          {/* --- Monthly revenue trend (single series: no legend needed) --- */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-bold text-gray-800">Monthly Revenue</h2>
            <p className="text-sm text-gray-500 mb-4">Last 12 months of approved payments.</p>
            <RevenueTrend data={data.trend} />
          </div>

          {/* --- Per-course breakdown --- */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 pb-3">
              <h2 className="text-lg font-bold text-gray-800">Revenue by Course</h2>
              <p className="text-sm text-gray-500">
                Paid students and revenue for {periodLabel}. Open a course to see exactly who paid.
              </p>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Students Paid</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">All-Time</th>
                    <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.courses.map((course) => (
                    <tr key={course.courseId} className="hover:bg-gray-50">
                      <td className="px-4 lg:px-6 py-4">
                        <div className="font-medium text-gray-900">{course.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {course.courseType === 'SUBSCRIPTION' ? '📅 Monthly Subscription' : '🔓 One-Time Purchase'}
                          {course.pendingPayments > 0 && ` · ${course.pendingPayments} pending`}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 text-right whitespace-nowrap">
                        {course.price === 0 ? 'Free' : formatCurrency(course.price)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right font-semibold">
                        {course.periodPaidStudents}
                        {course.periodPayments !== course.periodPaidStudents && (
                          <span className="text-xs font-normal text-gray-500"> ({course.periodPayments} pmts)</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                        {formatCurrency(course.periodRevenue)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 text-right whitespace-nowrap">
                        {formatCurrency(course.totalRevenue)}
                        <span className="block text-xs text-gray-400">{course.totalPaidStudents} students</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setPayersCourse({ id: course.courseId, title: course.title })}
                          className="btn-secondary whitespace-nowrap"
                        >
                          Who paid
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-4 lg:px-6 py-3 text-sm font-semibold text-gray-700">Total</td>
                    <td />
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {data.summary.periodPaidStudents}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                      {formatCurrency(data.summary.periodRevenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right whitespace-nowrap">
                      {formatCurrency(data.summary.totalRevenue)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="md:hidden divide-y divide-gray-200">
              {data.courses.map((course) => (
                <li key={course.courseId} className="p-4">
                  <div className="font-semibold text-gray-900">{course.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {course.courseType === 'SUBSCRIPTION' ? '📅 Monthly Subscription' : '🔓 One-Time Purchase'}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-500 text-xs">Students paid</div>
                      <div className="font-semibold text-gray-900">{course.periodPaidStudents}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Revenue</div>
                      <div className="font-bold text-gray-900">{formatCurrency(course.periodRevenue)}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPayersCourse({ id: course.courseId, title: course.title })}
                    className="btn-secondary w-full mt-3"
                  >
                    Who paid
                  </button>
                </li>
              ))}
            </ul>

            {data.courses.length === 0 && (
              <p className="p-8 text-center text-gray-500">No courses yet.</p>
            )}
          </div>

          {/* --- Everyone who paid in the period --- */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 pb-3">
              <h2 className="text-lg font-bold text-gray-800">Students Who Paid · {periodLabel}</h2>
              <p className="text-sm text-gray-500">
                {data.paidStudents.length === 0
                  ? 'No approved payments in this period.'
                  : `${data.summary.periodPaidStudents} student${data.summary.periodPaidStudents === 1 ? '' : 's'} across ${data.summary.periodPayments} approved payment${data.summary.periodPayments === 1 ? '' : 's'}.`}
              </p>
            </div>

            {data.paidStudents.length > 0 && (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid On</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.paidStudents.map((student) => (
                        <tr key={student.paymentId} className="hover:bg-gray-50">
                          <td className="px-4 lg:px-6 py-4">
                            <div className="font-medium text-gray-900">{student.studentName}</div>
                            <div className="text-sm text-gray-500 break-all">{student.studentEmail}</div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">{student.courseTitle}</td>
                          <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                            {format(new Date(student.paidAt), 'PP')}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 break-all">{student.referenceNumber || '—'}</td>
                          <td className="px-4 py-4 text-sm font-semibold text-gray-900 text-right whitespace-nowrap">
                            {formatCurrency(student.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ul className="md:hidden divide-y divide-gray-200">
                  {data.paidStudents.map((student) => (
                    <li key={student.paymentId} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 break-words">{student.studentName}</div>
                          <div className="text-sm text-gray-500 break-all">{student.studentEmail}</div>
                          <div className="text-sm text-gray-600 mt-1">{student.courseTitle}</div>
                        </div>
                        <div className="text-sm font-bold text-gray-900 whitespace-nowrap">
                          {formatCurrency(student.amount)}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Paid {format(new Date(student.paidAt), 'PP')}
                        {student.referenceNumber ? ` · Ref ${student.referenceNumber}` : ''}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </>
      )}

      {payersCourse && (
        <CoursePayersModal
          isOpen={!!payersCourse}
          onClose={() => setPayersCourse(null)}
          courseId={payersCourse.id}
          courseTitle={payersCourse.title}
          month={selectedMonth}
          availableMonths={availableMonths}
        />
      )}
    </div>
  );
}

// --- Single-series revenue bars: one hue, thin marks, rounded data-ends, hover tooltip ---
function RevenueTrend({ data }: { data: { month: string; label: string; revenue: number; payments: number }[] }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-center py-10 text-gray-400">No revenue data available.</p>;
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-1.5 sm:gap-2 h-44 min-w-[560px] border-b border-gray-200 pb-0">
        {data.map((point) => {
          const heightPct = point.revenue > 0 ? Math.max((point.revenue / maxRevenue) * 100, 2) : 0;

          return (
            <div key={point.month} className="relative flex-1 h-full flex flex-col justify-end items-center group">
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full mb-2 z-10 hidden group-hover:block whitespace-nowrap rounded-md bg-gray-900 text-white text-xs px-2.5 py-1.5 shadow-lg">
                <div className="font-semibold">{point.label}</div>
                <div>{formatCurrency(point.revenue)}</div>
                <div className="text-gray-300">{point.payments} payment{point.payments === 1 ? '' : 's'}</div>
              </div>
              <div
                className="w-full rounded-t bg-blue-600 group-hover:bg-blue-700 transition-colors"
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>
      {/* Axis labels */}
      <div className="flex gap-1.5 sm:gap-2 mt-2 min-w-[560px]">
        {data.map((point) => {
          const [, monthPart] = point.month.split('-');
          const shortLabel = new Date(Date.UTC(2000, Number(monthPart) - 1, 1))
            .toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
          return (
            <div key={point.month} className="flex-1 text-center text-[11px] text-gray-500">
              {shortLabel}
            </div>
          );
        })}
      </div>
    </div>
  );
}
