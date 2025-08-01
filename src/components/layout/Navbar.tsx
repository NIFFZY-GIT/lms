'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@/components/ui/Container';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const { user, isLoading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Dynamically determine the correct dashboard link
  const dashboardHref = user?.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/student/courses';

  const NavLinks = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      <Link href="/courses" className={isMobile ? "py-2" : ""} onClick={() => setIsMenuOpen(false)}>
        All Courses
      </Link>
      {user && (
         <Link href={dashboardHref} className={isMobile ? "py-2" : ""} onClick={() => setIsMenuOpen(false)}>
            My Dashboard
        </Link>
      )}
    </>
  );

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <Container>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-gray-800 hover:text-indigo-600 transition-colors">
            Online Thakshilawa
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-gray-600 font-medium">
            <NavLinks />
          </nav>

          {/* Auth Buttons & Mobile Menu Toggle */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="w-24 h-9 bg-gray-200 rounded-md animate-pulse"></div>
            ) : user ? (
              <button
                onClick={logout}
                className="hidden md:inline-block px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/auth/login" className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors">
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu (conditionally rendered) */}
        {isMenuOpen && (
          <div className="md:hidden pt-2 pb-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-2 text-lg font-medium text-gray-700">
                <NavLinks isMobile={true} />
            </nav>
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col space-y-3">
              {user ? (
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link href="/auth/login" className="px-4 py-2 rounded-md hover:bg-gray-100 transition-colors" onClick={() => setIsMenuOpen(false)}>
                    Login
                  </Link>
                  <Link href="/auth/register" className="px-4 py-2 text-center text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors" onClick={() => setIsMenuOpen(false)}>
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}