// src/app/dashboard/admin/page.tsx

import Link from 'next/link';
import { getBaseUrl } from '@/lib/server-base-url';
import { cookies } from 'next/headers';
import { format, formatDistanceToNow } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import {
    ArrowRight,
    BookOpen,
    Banknote,
    Users,
    Megaphone,
    Shield,
    UserCheck,
    TrendingUp,
    Receipt
} from 'lucide-react';

// --- Type Definitions ---
interface PaidStudent {
  paymentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  referenceNumber: string | null;
  paidAt: string;
}

interface CourseRevenue {
  courseId: string;
  title: string;
  periodRevenue: number;
  periodPaidStudents: number;
  totalRevenue: number;
  totalPaidStudents: number;
}

interface DashboardStats {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  pendingPayments: number;
  revenue: number;
  totalPaidStudents: number;
  month: string;
  monthLabel: string;
  monthRevenue: number;
  monthPaidStudentsCount: number;
  monthApprovedPayments: number;
  monthPaidStudents: PaidStudent[];
  courseRevenue: CourseRevenue[];
  recentCourses: { id: string; title: string; createdAt: string }[];
  recentUsers: { id: string; name: string; role: string; createdAt: string }[];
  enrollmentsTrend: { day: string; count: number }[];
}

// --- Server-Side Data Fetching (No Changes) ---
async function getDashboardStats(): Promise<DashboardStats | null> {
  try {
    const baseUrl = await getBaseUrl();
  const token = (await cookies()).get('token')?.value;
    if (!token) return null;

    const res = await fetch(`${baseUrl}/api/admin/dashboard-stats`, {
      headers: { Cookie: `token=${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error("Failed to fetch dashboard stats:", res.statusText);
      return null;
    }
    return res.json();
  } catch (_error) {
    console.error("Error fetching stats:", _error);
    return null;
  }
}

// --- Helper Component: StatCard (Slightly tweaked for mobile) ---
const StatCard = ({ title, value, icon, href }: { title: string; value: string | number; icon: React.ReactNode; href: string }) => (
  <Link
    href={href}
    className="group bg-white p-4 sm:p-5 rounded-xl shadow-sm hover:shadow-lg flex items-center justify-between gap-4 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:scale-[0.98]"
  >
    <div>
      <div className="text-blue-600 mb-2">{icon}</div>
      <p className="text-2xl sm:text-3xl font-bold text-gray-800 truncate">{value}</p>
      <p className="text-sm font-medium text-gray-500">{title}</p>
    </div>
    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0" />
  </Link>
);


// --- Main Page Component (Server Component with Responsive Enhancements) ---
export default async function AdminDashboardPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const base = `/${locale}/dashboard/admin`;
  const stats = await getDashboardStats();

  if (!stats) {
    return (
        <div className="text-center py-10">
            <h1 className="text-xl font-bold text-gray-800">Could not load dashboard data.</h1>
            <p className="text-gray-600 mt-2">Please try refreshing the page or check the server connection.</p>
        </div>
    );
  }

  const coursesWithRevenue = stats.courseRevenue.filter(c => c.periodPaidStudents > 0);

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-800">Admin Dashboard</h1>
        <p className="text-base text-gray-600 mt-1">{`Welcome back! Here's a summary of your platform's activity.`}</p>
      </div>

      {/* --- Mobile Quick Actions --- */}
      <div className="sm:hidden">
        <div className="-mx-4 px-4 overflow-x-auto pb-2">
            <div className="flex w-max gap-2">
                <Link href={`${base}/users`} className="btn-tab-mobile">Students</Link>
                <Link href={`${base}/instructors`} className="btn-tab-mobile">Instructors</Link>
                <Link href={`${base}/courses`} className="btn-tab-mobile">Courses</Link>
                <Link href={`${base}/payments`} className="btn-tab-mobile">Payments</Link>
                <Link href={`${base}/revenue`} className="btn-tab-mobile">Revenue</Link>
            </div>
        </div>
      </div>

      {/* --- Stat Cards Grid --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Students" value={stats.totalStudents} icon={<Users className="w-7 h-7" />} href={`${base}/users`} />
        <StatCard title="Instructors" value={stats.totalInstructors} icon={<UserCheck className="w-7 h-7" />} href={`${base}/instructors`} />
        <StatCard title="Courses" value={stats.totalCourses} icon={<BookOpen className="w-7 h-7" />} href={`${base}/courses`} />
        <StatCard title="Pending Payments" value={stats.pendingPayments} icon={<Banknote className="w-7 h-7" />} href={`${base}/payments`} />
      </div>

      {/* --- This Month's Money --- */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-blue-600" />
            {stats.monthLabel}
          </h2>
          <Link href={`${base}/revenue`} className="text-sm font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
            Full revenue report <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-700">Revenue This Month</p>
            <p className="text-2xl md:text-3xl font-bold text-emerald-900 mt-1 break-words">{formatCurrency(stats.monthRevenue)}</p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-700">Students Who Paid</p>
            <p className="text-2xl md:text-3xl font-bold text-blue-900 mt-1">{stats.monthPaidStudentsCount}</p>
            <p className="text-xs text-blue-700 mt-0.5">Payments approved this month</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-600">Approved Payments</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{stats.monthApprovedPayments}</p>
            <p className="text-xs text-gray-500 mt-0.5">Across {coursesWithRevenue.length} course{coursesWithRevenue.length === 1 ? '' : 's'}</p>
          </div>
        </div>
      </div>

      {/* --- Main Dashboard Grid (Stacks on mobile) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

        {/* --- Left Column (Main Content) --- */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600"/>Last 7 Days Enrollments</h2>
            <TrendBar data={stats.enrollmentsTrend} />
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <h2 className="text-lg font-bold text-gray-800">Students Who Paid — {stats.monthLabel}</h2>
              <Link href={`${base}/revenue`} className="text-sm font-medium text-blue-600 hover:text-blue-700">View all</Link>
            </div>
            <p className="text-sm text-gray-500 mb-4">Approved payments only.</p>
            <div className="divide-y divide-gray-100">
              {stats.monthPaidStudents.length > 0 ? (
                stats.monthPaidStudents.slice(0, 10).map((payment) => (
                  <div key={payment.paymentId} className="flex items-start justify-between gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 truncate">{payment.studentName}</p>
                      <p className="text-sm text-gray-500 truncate">{payment.courseTitle}</p>
                      <p className="text-xs text-gray-400 truncate">{payment.studentEmail}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-gray-500 whitespace-nowrap">{format(new Date(payment.paidAt), 'PP')}</p>
                      <p className="text-[11px] text-gray-400 whitespace-nowrap">{formatDistanceToNow(new Date(payment.paidAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No approved payments yet this month.</p>
              )}
            </div>
            {stats.monthPaidStudents.length > 10 && (
              <Link href={`${base}/revenue`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                See all {stats.monthPaidStudentsCount} students who paid <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Receipt className="w-5 h-5 text-blue-600"/>Revenue by Course — {stats.monthLabel}</h2>
              <Link href={`${base}/courses`} className="text-sm font-medium text-blue-600 hover:text-blue-700">Manage courses</Link>
            </div>
            {coursesWithRevenue.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="py-2 pr-4 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                      <th className="py-2 px-4 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                      <th className="py-2 pl-4 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {coursesWithRevenue.slice(0, 8).map((course) => (
                      <tr key={course.courseId}>
                        <td className="py-2.5 pr-4 text-sm text-gray-800">{course.title}</td>
                        <td className="py-2.5 px-4 text-sm text-gray-700 text-right font-semibold">{course.periodPaidStudents}</td>
                        <td className="py-2.5 pl-4 text-sm font-bold text-gray-900 text-right whitespace-nowrap">{formatCurrency(course.periodRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No course has an approved payment this month yet.</p>
            )}
          </div>
        </div>

        {/* --- Right Column (Side Content) --- */}
        <div className="space-y-6 md:space-y-8">
            <div className="bg-white p-5 rounded-xl shadow-sm">
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Revenue — {stats.monthLabel}</h3>
                <p className="text-2xl md:text-3xl font-bold text-emerald-700 break-words">{formatCurrency(stats.monthRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.monthPaidStudentsCount} student{stats.monthPaidStudentsCount === 1 ? '' : 's'} paid this month</p>
                <hr className="my-4" />
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Revenue (Approved)</h3>
                <p className="text-xl md:text-2xl font-bold text-gray-800 break-words">{formatCurrency(stats.revenue)}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.totalPaidStudents} student{stats.totalPaidStudents === 1 ? '' : 's'} have paid in total</p>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm">
                <h3 className="text-base font-semibold text-gray-800 mb-3">Recent Courses</h3>
                <ul className="divide-y divide-gray-100 text-sm">
                    {stats.recentCourses.length > 0 ? stats.recentCourses.map(c => (
                        <li key={c.id} className="py-2.5 flex items-center justify-between min-w-0">
                            <span className="truncate pr-4 text-gray-700">{c.title}</span>
                            <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </li>
                    )) : <li className="py-4 text-center text-sm text-gray-500">No recent courses</li>}
                </ul>
            </div>
            <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm">
                <h3 className="text-base font-semibold text-gray-800 mb-3">Recent Users</h3>
                <ul className="divide-y divide-gray-100 text-sm">
                    {stats.recentUsers.length > 0 ? stats.recentUsers.map(u => (
                        <li key={u.id} className="py-2.5 flex items-center justify-between min-w-0">
                            <span className="truncate pr-4 text-gray-700">{u.name}</span>
                            <span className="text-xs uppercase tracking-wider font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{u.role}</span>
                        </li>
                    )) : <li className="py-4 text-center text-sm text-gray-500">No recent users</li>}
                </ul>
            </div>
            <div className="space-y-3">
                <Link href={`${base}/revenue`} className="btn-dashboard-action">
                    <div className="flex items-center"><TrendingUp className="w-5 h-5 mr-3 text-blue-600"/><span className="font-medium">Revenue Report</span></div>
                    <ArrowRight className="w-5 h-5 text-gray-400"/>
                </Link>
                <Link href={`${base}/announcements`} className="btn-dashboard-action">
                    <div className="flex items-center"><Megaphone className="w-5 h-5 mr-3 text-blue-600"/><span className="font-medium">Manage Announcements</span></div>
                    <ArrowRight className="w-5 h-5 text-gray-400"/>
                </Link>
                <Link href={`${base}/admins`} className="btn-dashboard-action">
                    <div className="flex items-center"><Shield className="w-5 h-5 mr-3 text-blue-600"/><span className="font-medium">Manage Admins</span></div>
                    <ArrowRight className="w-5 h-5 text-gray-400"/>
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper Component: TrendBar (Responsive tweaks) ---
function TrendBar({ data }: { data: { day: string; count: number }[] }) {
  if (!data || data.length === 0) return <p className="text-sm text-center py-10 text-gray-400">No enrollment data available.</p>;

  const maxCount = Math.max(...data.map(d => d.count), 1); // Avoid division by zero

  return (
    <div className="flex items-end gap-2 sm:gap-3 h-32 sm:h-36 pt-2">
      {data.map(d => (
        <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5 group">
          <div
            className="w-full bg-blue-200 group-hover:bg-blue-300 rounded-t-md transition-all duration-200"
            style={{ height: `${(d.count / maxCount) * 100}%` }}
          ></div>
          <span className="text-[11px] sm:text-xs text-gray-600 font-medium">{d.count}</span>
          <span className="text-[10px] sm:text-xs text-gray-500">{new Date(d.day).toLocaleDateString('en-US', { weekday: 'short' })}</span>
        </div>
      ))}
    </div>
  );
}
