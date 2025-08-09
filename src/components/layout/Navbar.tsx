'use client';

import Link from 'next/link';
import Image from 'next/image'; // Import the Next.js Image component
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@/components/ui/Container';
import { Menu, X, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';
import { usePathname } from 'next/navigation';

// --- Reusable NavLink Component for Active State ---
const NavLink = ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link 
            href={href} 
            onClick={onClick}
            className={`transition-colors hover:text-indigo-600 ${isActive ? 'text-indigo-600 font-semibold' : 'text-gray-600'}`}
        >
            {children}
        </Link>
    );
};

// --- User Dropdown Component ---
interface User {
    name: string;
    role: 'ADMIN' | 'STUDENT' | string;
    // Add other user properties as needed
}

const UserDropdown = ({ user, logout }: { user: User; logout: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const dashboardHref = user?.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/student/courses';

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2">
                <span className="bg-gray-200 text-gray-600 rounded-full h-8 w-8 flex items-center justify-center">
                    <UserIcon className="w-5 h-5"/>
                </span>
                <span className="hidden sm:inline font-medium text-gray-700">{user.name}</span>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                    <Link href={dashboardHref} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                    </Link>
                    <button onClick={logout} className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </button>
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
    <header className="bg-white/90 backdrop-blur-lg shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
                src="/logo.png" // Assumes logo.png is in the /public directory
                alt="Online Thakshilawa Logo"
                width={180}   // Adjust width as needed
                height={40}  // Adjust height as needed
                priority     // Preload the logo for better performance
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-md">
            <NavLinksContent />
          </nav>

          {/* Auth Buttons & Mobile Menu Toggle */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="w-24 h-9 bg-gray-200 rounded-md animate-pulse"></div>
            ) : user ? (
              <UserDropdown user={user} logout={logout} />
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/auth/login" className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
                  Login
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm">
                  Register
                </Link>
              </div>
            )}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pt-4 pb-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4 text-lg font-medium text-gray-700">
                <NavLinksContent />
            </nav>
            {/* Divider and auth buttons for mobile */}
            {!user && (
                 <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col space-y-3">
                    <Link href="/auth/login" className="text-center w-full px-4 py-2 rounded-md hover:bg-gray-100 transition-colors" onClick={closeMenu}>
                        Login
                    </Link>
                    <Link href="/auth/register" className="btn-primary w-full text-center" onClick={closeMenu}>
                        Register
                    </Link>
                </div>
            )}
          </div>
        )}
      </Container>
    </header>
  );
}