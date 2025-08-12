'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@/components/ui/Container';
import { Menu, X, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';
import { usePathname } from 'next/navigation';

// --- Reusable NavLink Component (UPDATED) ---
const NavLink = ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            onClick={onClick}
            // Add group to the parent Link for the hover effect
            className={`relative group transition-colors ${isActive ? 'text-indigo-600 font-semibold' : 'text-gray-600 hover:text-indigo-600'}`}
        >
            {/* Wrap children in a span to contain the underline */}
            <span className="relative">
                {children}
                {/* The underline is now an absolute element inside the span */}
                <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-indigo-600 transition-all duration-300 ease-out
                        ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}
                    `}
                />
            </span>
        </Link>
    );
};


// --- User Dropdown Component (No changes needed) ---
interface User {
  name: string;
  role: 'ADMIN' | 'STUDENT' | 'INSTRUCTOR';
}
const UserDropdown = ({ user, logout }: { user: User; logout: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const dashboardHref = user?.role === 'ADMIN' ? '/dashboard/admin' : user?.role === 'INSTRUCTOR' ? '/dashboard/instructor' : '/dashboard/student/courses';
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2">
                <span className="bg-gray-200 text-gray-600 rounded-full h-8 w-8 flex items-center justify-center"><UserIcon className="w-5 h-5"/></span>
                <span className="hidden sm:inline font-medium text-gray-700">{user.name}</span>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                    <Link href={dashboardHref} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><LayoutDashboard className="w-4 h-4 mr-2" />Dashboard</Link>
                    <button onClick={logout} className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4 mr-2" />Logout</button>
                </div>
            )}
        </div>
    );
};


export function Navbar() {
  const { user, isLoading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  const NavLinksContent = () => (
    <>
      <NavLink href="/" onClick={closeMenu}>Home</NavLink>
      <NavLink href="/courses" onClick={closeMenu}>All Courses</NavLink>
      <NavLink href="/announcements" onClick={closeMenu}>Announcements</NavLink>
    </>
  );

  return (
    <header className="bg-white/90 backdrop-blur-lg sticky top-0 z-50 border-b border-gray-200">
      <Container>
        <div className="flex items-center justify-between h-16">
          <Link href="/" className={`${isMenuOpen ? 'pointer-events-none' : ''} inline-flex shrink-0`}>
            <Image
                src="/logo.png" // Assumes logo.png is in /public
                alt="Online Thakshilawa Logo"
                width={160} height={40}
                priority
            />
          </Link>
          <nav className="hidden md:flex items-center space-x-8 text-md">
            <NavLinksContent />
          </nav>
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="w-24 h-9 bg-gray-200 rounded-md animate-pulse" />
            ) : user ? (
              <UserDropdown user={user} logout={logout} />
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/auth/login" className="btn-ghost text-sm">Login</Link>
                <Link href="/auth/register" className="btn-primary text-sm">Register</Link>
              </div>
            )}
            <div className="md:hidden relative z-[80]">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                type="button"
                aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        {isMenuOpen && (
          <>
            {/* Screen overlay to capture outside clicks and prevent accidental navigation */}
            <div
              className="fixed inset-0 z-[60] bg-black/30 md:hidden"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); closeMenu(); }}
              aria-hidden
            />
            <div className="md:hidden pt-4 pb-4 border-t relative z-[70] bg-white">
              <nav className="flex flex-col space-y-4 text-lg px-1">
              <NavLinksContent />
              </nav>
              {!user && (
                <div className="mt-6 pt-4 border-t grid grid-cols-2 gap-2">
                  <Link href="/auth/login" className="btn-ghost justify-center" onClick={closeMenu}>Login</Link>
                  <Link href="/auth/register" className="btn-primary justify-center" onClick={closeMenu}>Register</Link>
                </div>
              )}
            </div>
          </>
        )}
      </Container>
    </header>
  );
}