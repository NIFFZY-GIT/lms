"use client";
import Link from 'next/link';
import { LayoutDashboard, BookOpen, Banknote, Users, LogOut, Megaphone, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const NavLink = ({ href, icon: Icon, children }: { href: string; icon: React.ElementType, children: React.ReactNode }) => (
    <Link href={href} className="flex items-center px-4 py-2.5 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors">
        <Icon className="w-5 h-5 mr-3" />
        <span>{children}</span>
    </Link>
);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/auth/login');
      } else if (user.role === 'INSTRUCTOR') {
        router.replace('/dashboard/instructor');
      } else if (user.role !== 'ADMIN') {
        router.replace('/auth/login');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'ADMIN') {
    return <div className="p-8">Loading...</div>;
  }
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col p-4">
  <div className="text-2xl font-bold mb-10 px-4">Admin Panel</div>
        <nav className="flex-grow space-y-2">
            <NavLink href="/dashboard/admin" icon={LayoutDashboard}>Dashboard</NavLink>
            <NavLink href="/dashboard/admin/courses" icon={BookOpen}>Courses</NavLink>
            <NavLink href="/dashboard/admin/payments" icon={Banknote}>Payments</NavLink>
              <NavLink href="/dashboard/admin/announcements" icon={Megaphone}>Announcements</NavLink>
              <NavLink href="/dashboard/admin/users" icon={Users}>Students</NavLink>
          
            <NavLink href="/dashboard/admin/admins" icon={Shield}>Admins</NavLink>
        </nav>
        <div className="mt-auto">
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="flex items-center w-full px-4 py-2.5 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors">
                <LogOut className="w-5 h-5 mr-3" /> Logout
              </button>
            </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10">
        {children}
      </main>
    </div>
  );
}