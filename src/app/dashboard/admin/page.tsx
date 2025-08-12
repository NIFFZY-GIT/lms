import Link from 'next/link';
import { getBaseUrl, formatCurrency } from '@/lib/utils';
import { cookies } from 'next/headers';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, BookOpen, Banknote, Users, Megaphone, Shield, UserCheck, TrendingUp } from 'lucide-react';

// --- Type Definitions ---
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

// --- Server-Side Data Fetching ---
async function getDashboardStats(): Promise<DashboardStats | null> {
  try {
    const baseUrl = getBaseUrl();
    const token = (await cookies()).get('token')?.value; // FIX: Added await
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
  } catch (error) {
    console.error("Error fetching stats:", error);
    return null;
  }
}

// --- Helper Component ---
const StatCard = ({ title, value, icon, href }: { title: string; value: number | string; icon: React.ReactNode; href: string }) => (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-start justify-between">
        <div>
            <div className="text-indigo-500">{icon}</div>
            <p className="text-3xl font-extrabold text-gray-800 mt-2">{value}</p>
            <p className="text-sm font-medium text-gray-500">{title}</p>
        </div>
        <Link href={href} className="text-gray-400 hover:text-indigo-600 transition-colors"><ArrowRight className="w-5 h-5"/></Link>
    </div>
);

// --- Main Page Component (Server Component) ---
export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        {/* FIX: Using template literal for the apostrophe */}
        <p className="text-gray-600 mt-1">{`Welcome back! Here's a summary of your platform's activity.`}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Students" value={stats?.totalStudents ?? 0} icon={<Users className="w-8 h-8" />} href="/dashboard/admin/users" />
        <StatCard title="Instructors" value={stats?.totalInstructors ?? 0} icon={<UserCheck className="w-8 h-8" />} href="/dashboard/admin/instructors" />
        <StatCard title="Courses" value={stats?.totalCourses ?? 0} icon={<BookOpen className="w-8 h-8" />} href="/dashboard/admin/courses" />
        <StatCard title="Pending Payments" value={stats?.pendingPayments ?? 0} icon={<Banknote className="w-8 h-8" />} href="/dashboard/admin/payments" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left side main panels */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-500"/>Last 7 Days Enrollments</h2>
            <TrendBar data={stats?.enrollmentsTrend || []} />
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Approved Enrollments</h2>
            <div className="space-y-4">
              {stats?.recentPayments && stats.recentPayments.length > 0 ? (
                stats.recentPayments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-700">{payment.studentName}</p>
                      <p className="text-sm text-gray-500">Enrolled in &quot;{payment.courseTitle}&quot;</p>
                    </div>
                    <p className="text-sm text-gray-400 flex-shrink-0">
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

        {/* Right side panels */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Revenue (Approved)</h3>
            <p className="text-3xl font-bold text-gray-800">{formatCurrency(stats?.revenue ?? 0)}</p>
            <p className="text-xs text-gray-400 mt-1">Sum of approved payments * course price</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Courses</h3>
            <ul className="divide-y text-sm">
              {stats?.recentCourses?.map(c => (
                <li key={c.id} className="py-2 flex items-center justify-between">
                  <span className="truncate pr-4">{c.title}</span>
                  <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                </li>
              )) || <li className="py-2 text-gray-400">No data</li>}
            </ul>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Users</h3>
            <ul className="divide-y text-sm">
              {stats?.recentUsers?.map(u => (
                <li key={u.id} className="py-2 flex items-center justify-between">
                  <span className="truncate pr-4">{u.name}</span>
                  <span className="text-[10px] uppercase tracking-wide text-indigo-600 font-medium">{u.role}</span>
                </li>
              )) || <li className="py-2 text-gray-400">No data</li>}
            </ul>
          </div>
          <div className="space-y-4">
             <Link href="/dashboard/admin/announcements" className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md hover:bg-gray-50 transition-colors">
                <div className="flex items-center"><Megaphone className="w-6 h-6 mr-4 text-indigo-500"/><span className="font-semibold">Manage Announcements</span></div>
                <ArrowRight className="w-5 h-5 text-gray-400"/>
            </Link>
             <Link href="/dashboard/admin/admins" className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md hover:bg-gray-50 transition-colors">
                <div className="flex items-center"><Shield className="w-6 h-6 mr-4 text-indigo-500"/><span className="font-semibold">Manage Admins</span></div>
                <ArrowRight className="w-5 h-5 text-gray-400"/>
            </Link>
        </div>
        </div>
      </div>
    </div>
  );
}

function TrendBar({ data }: { data: { day: string; count: number }[] }) {
  if (!data || data.length === 0) return <p className="text-sm text-gray-400">No data</p>;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map(d => (
        <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t bg-indigo-500 transition-all" style={{ height: `${(d.count / max) * 100}%` }} />
          <span className="text-[10px] text-gray-500 rotate-[-45deg] origin-top-left translate-y-2">{d.day.slice(5)}</span>
          <span className="text-[10px] text-gray-600 font-medium">{d.count}</span>
        </div>
      ))}
    </div>
  );
}