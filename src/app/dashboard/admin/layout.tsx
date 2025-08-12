"use client";
import Link from 'next/link';
import { LayoutDashboard, BookOpen, Banknote, Users, LogOut, Megaphone, Shield, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const NavLink = ({ href, icon: Icon, children, onClick }: { href: string; icon: React.ElementType, children: React.ReactNode; onClick?: () => void }) => (
  <Link href={href} onClick={onClick} className="flex items-center px-4 py-2.5 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors">
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/30 md:hidden"
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setSidebarOpen(false); }}
          aria-hidden
        />
      )}

      {/* Sidebar */}
    <aside
        className={
      `fixed inset-y-0 left-0 z-[70] w-64 transform bg-gray-800 text-white flex flex-col p-4 transition-transform duration-200 ease-out
           ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
           md:static md:translate-x-0`
        }
        aria-label="Admin sidebar navigation"
      >
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="text-2xl font-bold">Admin Panel</div>
          {/* Close button on mobile */}
          <button
            className="md:hidden p-2 rounded-md text-gray-200 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            onClick={() => setSidebarOpen(false)}
            type="button"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-grow space-y-2">
          <NavLink href="/dashboard/admin" icon={LayoutDashboard} onClick={() => setSidebarOpen(false)}>Dashboard</NavLink>
          <NavLink href="/dashboard/admin/courses" icon={BookOpen} onClick={() => setSidebarOpen(false)}>Courses</NavLink>
          <NavLink href="/dashboard/admin/payments" icon={Banknote} onClick={() => setSidebarOpen(false)}>Payments</NavLink>
          <NavLink href="/dashboard/admin/announcements" icon={Megaphone} onClick={() => setSidebarOpen(false)}>Announcements</NavLink>
          <NavLink href="/dashboard/admin/users" icon={Users} onClick={() => setSidebarOpen(false)}>Students</NavLink>
          <NavLink href="/dashboard/admin/admins" icon={Shield} onClick={() => setSidebarOpen(false)}>Admins</NavLink>
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
      <main className="flex-1 p-4 sm:p-6 lg:p-10">
        {/* Mobile topbar */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            type="button"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
            Menu
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}