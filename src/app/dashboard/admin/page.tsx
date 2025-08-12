// src/app/dashboard/admin/page.tsx

import Link from 'next/link';
import { getBaseUrl } from '@/lib/utils';
import { cookies } from 'next/headers';
import { formatDistanceToNow } from 'date-fns';
import {
    ArrowRight,
    BookOpen,
    Banknote,
    Users,
    Megaphone,
    Shield,
    UserCheck,
    TrendingUp
} from 'lucide-react';

// --- Type Definitions (No Changes) ---
interface DashboardStats {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  pendingPayments: number;
  revenue: number;
  recentPayments: { createdAt: string; studentName: string; courseTitle: string; }[];
  recentCourses: { id: string; title: string; createdAt: string }[];
  recentUsers: { id: string; name: string; role: string; createdAt: string }[];
  enrollmentsTrend: { day: string; count: number }[];
}

// --- Server-Side Data Fetching (No Changes) ---
async function getDashboardStats(): Promise<DashboardStats | null> {
  try {
    const baseUrl = getBaseUrl();
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
export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  if (!stats) {
    return (
        <div className="text-center py-10">
            <h1 className="text-xl font-bold text-gray-800">Could not load dashboard data.</h1>
            <p className="text-gray-600 mt-2">Please try refreshing the page or check the server connection.</p>
        </div>
    );
  }

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
                <Link href="/dashboard/admin/students" className="btn-tab-mobile">Students</Link>
                <Link href="/dashboard/admin/instructors" className="btn-tab-mobile">Instructors</Link>
                <Link href="/dashboard/admin/courses" className="btn-tab-mobile">Courses</Link>
                <Link href="/dashboard/admin/payments" className="btn-tab-mobile">Payments</Link>
            </div>
        </div>
      </div>

      {/* --- Stat Cards Grid --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Students" value={stats.totalStudents} icon={<Users className="w-7 h-7" />} href="/dashboard/admin/users" />
        <StatCard title="Instructors" value={stats.totalInstructors} icon={<UserCheck className="w-7 h-7" />} href="/dashboard/admin/instructors" />
        <StatCard title="Courses" value={stats.totalCourses} icon={<BookOpen className="w-7 h-7" />} href="/dashboard/admin/courses" />
        <StatCard title="Pending Payments" value={stats.pendingPayments} icon={<Banknote className="w-7 h-7" />} href="/dashboard/admin/payments" />
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
            <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Approved Enrollments</h2>
            <div className="space-y-4">
              {stats.recentPayments.length > 0 ? (
                stats.recentPayments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3 last:border-b-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 truncate">{payment.studentName}</p>
                      <p className="text-sm text-gray-500 truncate">Enrolled in &quot;{payment.courseTitle}&quot;</p>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 flex-shrink-0 whitespace-nowrap">
                      {formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No recent activity.</p>
              )}
            </div>
          </div>
        </div>

        {/* --- Right Column (Side Content) --- */}
        <div className="space-y-6 md:space-y-8">
            <div className="bg-white p-5 rounded-xl shadow-sm">
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Revenue (Approved)</h3>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">LKR {stats.revenue.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                <Link href="/dashboard/admin/announcements" className="btn-dashboard-action">
                    <div className="flex items-center"><Megaphone className="w-5 h-5 mr-3 text-blue-600"/><span className="font-medium">Manage Announcements</span></div>
                    <ArrowRight className="w-5 h-5 text-gray-400"/>
                </Link>
                <Link href="/dashboard/admin/admins" className="btn-dashboard-action">
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