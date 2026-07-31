'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Banknote, Loader2, Users } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import { ALL_TIME, formatMonthLabel } from '@/lib/month-utils';

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

interface CoursePayersResponse {
  month: string | null;
  monthLabel: string;
  course: { id: string; title: string; price: number; courseType: string };
  students: PaidStudent[];
  totals: { revenue: number; payments: number; paidStudents: number };
}

const fetchCoursePayers = async (courseId: string, month: string): Promise<CoursePayersResponse> =>
  (await axios.get(`/api/admin/revenue/${courseId}?month=${month}`)).data;

interface CoursePayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  /** Month key (`YYYY-MM`) the modal should open on. */
  month: string;
  /** Month keys offered in the picker, newest first. */
  availableMonths: string[];
}

/**
 * Lists every student whose payment for a course was approved, with the
 * revenue those payments represent, for a chosen month or all time.
 */
export function CoursePayersModal({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  month,
  availableMonths,
}: CoursePayersModalProps) {
  const [selectedMonth, setSelectedMonth] = useState(month);

  // Re-sync when the modal is reopened from a different month context.
  useEffect(() => {
    if (isOpen) setSelectedMonth(month);
  }, [isOpen, month]);

  const { data, isLoading, isError } = useQuery<CoursePayersResponse>({
    queryKey: ['coursePayers', courseId, selectedMonth],
    queryFn: () => fetchCoursePayers(courseId, selectedMonth),
    enabled: isOpen && !!courseId,
  });

  // The API echoes back the month it actually used, so an empty/unknown initial
  // value still shows the period the listed payments belong to.
  const activeMonth = selectedMonth || data?.month || ALL_TIME;
  const monthOptions = activeMonth === ALL_TIME || availableMonths.includes(activeMonth)
    ? availableMonths
    : [activeMonth, ...availableMonths];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Who Paid — ${courseTitle}`} size="4xl">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <label className="text-sm text-gray-600">
            <span className="block mb-1 font-medium text-gray-700">Period</span>
            <select
              value={activeMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white min-w-[200px]"
            >
              {monthOptions.map((option) => (
                <option key={option} value={option}>{formatMonthLabel(option)}</option>
              ))}
              <option value={ALL_TIME}>All Time</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <Banknote className="w-4 h-4" /> Revenue
              </div>
              <p className="text-lg font-bold text-emerald-900 mt-0.5">
                {formatCurrency(data?.totals.revenue ?? 0)}
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700">
                <Users className="w-4 h-4" /> Students Paid
              </div>
              <p className="text-lg font-bold text-blue-900 mt-0.5">
                {data?.totals.paidStudents ?? 0}
                {data && data.totals.payments !== data.totals.paidStudents && (
                  <span className="text-xs font-medium text-blue-700 ml-1">
                    ({data.totals.payments} payments)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading payers...
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-red-600">Could not load the payer list. Please try again.</div>
        ) : !data || data.students.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            No approved payments for this course in {data?.monthLabel ?? formatMonthLabel(activeMonth)}.
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block max-h-[26rem] overflow-y-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid On</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.students.map((student) => (
                    <tr key={student.paymentId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{student.studentName}</div>
                        {student.subscriptionExpiryDate && (
                          <div className="text-xs text-gray-500">
                            Active until {format(new Date(student.subscriptionExpiryDate), 'PP')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="break-all">{student.studentEmail}</div>
                        <div>{student.studentPhone || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {format(new Date(student.paidAt), 'PP')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 break-all">
                        {student.referenceNumber || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right whitespace-nowrap">
                        {formatCurrency(student.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 sticky bottom-0">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-700">Total</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right whitespace-nowrap">
                      {formatCurrency(data.totals.revenue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="sm:hidden space-y-3 max-h-[26rem] overflow-y-auto">
              {data.students.map((student) => (
                <li key={student.paymentId} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 break-words">{student.studentName}</div>
                      <div className="text-sm text-gray-500 break-all">{student.studentEmail}</div>
                      <div className="text-sm text-gray-500">{student.studentPhone || '—'}</div>
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

        <p className="text-xs text-gray-400">
          Only approved payments are counted. Each payment is valued at the course&apos;s current price, so a
          monthly subscription course counts once per approved month.
        </p>
      </div>
    </Modal>
  );
}
