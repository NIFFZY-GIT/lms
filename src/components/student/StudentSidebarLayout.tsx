'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BookOpen, BarChart3, Menu, X } from 'lucide-react';

function NavLink({ href, icon: Icon, children, onClick }: { href: string; icon: React.ElementType; children: React.ReactNode; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
        isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="flex-grow">{children}</span>
    </Link>
  );
}

export function StudentSidebarLayout({ userName, children }: { userName: string; children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 bg-gray-800 text-white w-64 p-4 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Student sidebar"
      >
        <div className="flex items-center justify-between mb-6 px-2">
          <Link href="/" className="text-xl font-bold text-white">Online Thakshilawa</Link>
          <button
            className="lg:hidden p-1 text-gray-300 hover:text-white"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>
        <div className="px-2 mb-6">
          <p className="text-xs text-gray-400">Welcome,</p>
          <p className="font-semibold text-base truncate">{userName}</p>
        </div>
        <nav className="flex flex-col flex-grow h-full">
          <div className="space-y-2">
            <NavLink href="/dashboard/student/courses" icon={BookOpen} onClick={() => setSidebarOpen(false)}>My Courses</NavLink>
            <NavLink href="/dashboard/student/results" icon={BarChart3} onClick={() => setSidebarOpen(false)}>My Results</NavLink>
          </div>
        </nav>
      </aside>

      {/* Backdrop for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 bg-white/80 backdrop-blur-sm shadow-sm z-30">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-700"
              aria-label="Open sidebar"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm truncate max-w-[160px]">{userName}</span>
              <div className="bg-blue-600 text-white rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold">
                {userName?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default StudentSidebarLayout;
