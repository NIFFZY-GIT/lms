import Link from 'next/link';
import { getBaseUrl } from '@/lib/utils';
import { cookies } from 'next/headers';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, BookOpen, Banknote, Users, Megaphone, Shield } from 'lucide-react';

// --- Type Definitions ---
interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  pendingPayments: number;
  recentPayments: { createdAt: string; studentName: string; courseTitle: string; }[];
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Students" value={stats?.totalStudents ?? 0} icon={<Users className="w-8 h-8" />} href="/dashboard/admin/users" />
        <StatCard title="Total Courses" value={stats?.totalCourses ?? 0} icon={<BookOpen className="w-8 h-8" />} href="/dashboard/admin/courses" />
        <StatCard title="Pending Payments" value={stats?.pendingPayments ?? 0} icon={<Banknote className="w-8 h-8" />} href="/dashboard/admin/payments" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Enrollments</h2>
          <div className="space-y-4">
            {stats?.recentPayments && stats.recentPayments.length > 0 ? (
                stats.recentPayments.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                        <div>
                            <p className="font-medium text-gray-700">{payment.studentName}</p>
                            {/* FIX: Template literal handles the quotes correctly */}
                            <p className="text-sm text-gray-500">{`Enrolled in "${payment.courseTitle}"`}</p>
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
  );
}