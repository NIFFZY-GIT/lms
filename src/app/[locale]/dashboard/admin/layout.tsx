// app/dashboard/admin/layout.tsx
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, BookOpen, Banknote, Users, Megaphone, Shield, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { withAdminAuth } from '@/components/auth/withAdminAuth'; // Import the HOC

// --- Improved NavLink with Active State ---
const NavLink = ({ href, icon: Icon, children, onClick }: { href: string; icon: React.ElementType, children: React.ReactNode; onClick?: () => void }) => {
    const pathname = usePathname();
    // Exact match for dashboard, startsWith for others, accounting for locale prefixes
    const isActive = href.endsWith('/dashboard/admin') ? pathname.endsWith('/dashboard/admin') : pathname.includes(href.replace('/en/', '/'));

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
};

// --- Main Layout Component ---
function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 flex">
        {/* --- Sidebar --- */}
        <aside
            className={`fixed inset-y-0 left-0 bg-gray-800 text-white w-64 p-4 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            aria-label="Admin sidebar"
        >
            <div className="flex items-center justify-between mb-6 px-2">
                <Link href="/en" className="text-xl font-bold text-white">Online Thakshilawa</Link>
                <button
                    className="lg:hidden p-1 text-gray-300 hover:text-white"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close sidebar"
                >
                    <X size={24} />
                </button>
            </div>
            <nav className="flex flex-col flex-grow h-full">
                <div className="space-y-2">
                    <NavLink href="/en/dashboard/admin" icon={LayoutDashboard} onClick={() => setSidebarOpen(false)}>Dashboard</NavLink>
                    <NavLink href="/en/dashboard/admin/courses" icon={BookOpen} onClick={() => setSidebarOpen(false)}>Courses</NavLink>
                    <NavLink href="/en/dashboard/admin/payments" icon={Banknote} onClick={() => setSidebarOpen(false)}>Payments</NavLink>
                    <NavLink href="/en/dashboard/admin/announcements" icon={Megaphone} onClick={() => setSidebarOpen(false)}>Announcements</NavLink>
                    <NavLink href="/en/dashboard/admin/users" icon={Users} onClick={() => setSidebarOpen(false)}>Students</NavLink>
                    <NavLink href="/en/dashboard/admin/admins" icon={Shield} onClick={() => setSidebarOpen(false)}>Admins</NavLink>
                </div>
            
            </nav>
        </aside>

        {/* --- Backdrop for Mobile --- */}
        {sidebarOpen && (
            <div
                className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
            />
        )}

        {/* --- Main Content Wrapper --- */}
        <div className="flex-1 flex flex-col">
            {/* --- Persistent Mobile Header --- */}
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
                         <span className="font-semibold text-sm">{user?.name}</span>
                         <div className="bg-blue-600 text-white rounded-full h-8 w-8 flex items-center justify-center text-sm font-bold">
                             {user?.name?.charAt(0).toUpperCase()}
                         </div>
                    </div>
                </div>
            </header>

            {/* --- Page Content --- */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    </div>
  );
}

// Wrap the layout with the HOC and export it
export default withAdminAuth(AdminLayout);