'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@/components/ui/Container';
import { Menu, X, LogOut, LayoutDashboard, House, BookOpen, Megaphone } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Portal } from '@/components/ui/Portal';

// --- Reusable NavLink Component (No changes needed, your version is great) ---
const NavLink = ({ href, children, onClick, icon: Icon }: { href: string; children: React.ReactNode; onClick?: () => void; icon?: React.ElementType }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
            href={href}
            onClick={onClick}
            // The group class on the parent Link enables the hover effect on the child span
            className={`relative group transition-colors block md:inline-flex w-full md:w-auto py-3 md:py-0 px-4 md:px-0 ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-700 hover:text-blue-600'}`}
        >
            {/* The relative span contains the text and the absolute underline */}
            <span className="relative inline-flex items-center gap-2">
                {Icon ? <Icon className="w-4 h-4 opacity-80" /> : null}
                <span>{children}</span>
                {/* The underline element transitions its width on hover or when active */}
                <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-blue-600 transition-all duration-300 ease-out
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
            <button onClick={() => setIsOpen(!isOpen)}
              aria-haspopup="menu"
              aria-expanded={isOpen}
              className="flex items-center gap-2 rounded-full px-2 py-1.5 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <span className="bg-blue-600 text-white rounded-full h-8 w-8 inline-flex items-center justify-center text-sm font-semibold">
                  {(user.name || 'U').slice(0,1).toUpperCase()}
                </span>
                <span className="hidden sm:inline font-medium text-gray-800">{user.name}</span>
            </button>
            {isOpen && (
                <div role="menu" aria-label="User menu" className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 z-50 border">
                    <div className="px-4 pb-2 text-xs text-gray-500">Signed in as</div>
                    <div className="px-4 pb-2 text-sm font-medium text-gray-800">{user.name}</div>
                    <Link href={dashboardHref} role="menuitem" className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><LayoutDashboard className="w-4 h-4 mr-2" />Dashboard</Link>
                    <button role="menuitem" onClick={logout} className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4 mr-2" />Logout</button>
                </div>
            )}
        </div>
    );
};


export function Navbar() {
  const { user, isLoading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const pathname = usePathname();

  const closeMenu = () => setIsMenuOpen(false);

  // All your useEffect hooks for accessibility and state management are excellent and have been kept.
  // ... (useEffect hooks for route change, ESC key, body scroll lock, header height, scroll elevation, and focus trap)

  useEffect(() => { closeMenu(); }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalOverflow || '';
    }
    return () => { document.body.style.overflow = originalOverflow || ''; };
  }, [isMenuOpen]);

  useEffect(() => {
    const updateHeaderVar = () => {
      if (headerRef.current) {
        const h = headerRef.current.getBoundingClientRect().height;
        document.documentElement.style.setProperty('--app-header-h', `${Math.round(h)}px`);
      }
    };
    updateHeaderVar();
    window.addEventListener('resize', updateHeaderVar);
    return () => window.removeEventListener('resize', updateHeaderVar);
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 2);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const closeBtnEl = closeBtnRef.current;
    const triggerEl = triggerRef.current;
    const focusTimer = setTimeout(() => closeBtnEl?.focus(), 50);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter(el => !el.hasAttribute('aria-hidden'));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first) { e.preventDefault(); last.focus(); }
      } else {
        if (active === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      triggerEl?.focus();
    };
  }, [isMenuOpen]);


  return (
    <header ref={headerRef} className={`sticky top-0 z-40 backdrop-blur-lg transition-all duration-300 ${isScrolled ? 'bg-white/90 shadow-sm' : 'bg-white/70'} border-b border-gray-200`}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 bg-white text-blue-600">Skip to main content</a>
      <Container>
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="inline-flex shrink-0" onClick={() => isMenuOpen && closeMenu()}>
            <Image
                src="/logo.png"
                alt="Online Thakshilawa Logo"
                width={160} height={40}
                priority
            />
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-[15px]" aria-label="Primary">
            <NavLink href="/" icon={House}>Home</NavLink>
            <NavLink href="/courses" icon={BookOpen}>All Courses</NavLink>
            <NavLink href="/announcements" icon={Megaphone}>Announcements</NavLink>
          </nav>

          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="w-24 h-9 bg-gray-200 rounded-md animate-pulse" />
            ) : user ? (
                <UserDropdown user={user} logout={logout} />
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/auth/login" className="btn-ghost text-sm">Login</Link>
                <Link href="/auth/register" className="btn-primary text-sm">Get Started</Link>
              </div>
            )}
            <div className="md:hidden">
              <button
                ref={triggerRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                type="button"
                aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu-panel"
                className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </Container>
        {/* --- IMPROVED Mobile Menu --- */}
        <Portal>
            {/* Backdrop Overlay */}
            <div
                className={`fixed inset-0 bg-black/30 md:hidden transition-opacity duration-300 ease-in-out ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={closeMenu}
                aria-hidden="true"
            />
            {/* Mobile Menu Panel */}
            <div
                id="mobile-menu-panel"
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label="Mobile menu"
                className={`fixed top-0 bottom-0 right-0 w-full max-w-sm bg-white shadow-xl md:hidden flex flex-col transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <span className="font-semibold text-gray-800">Menu</span>
                    <button
                        ref={closeBtnRef}
                        onClick={closeMenu}
                        aria-label="Close menu"
                        className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {/* Navigation Links */}
                <nav className="flex-grow p-4">
                  <NavLink href="/" icon={House} onClick={closeMenu}>Home</NavLink>
                  <NavLink href="/courses" icon={BookOpen} onClick={closeMenu}>All Courses</NavLink>
                  <NavLink href="/announcements" icon={Megaphone} onClick={closeMenu}>Announcements</NavLink>
                </nav>
                {/* Bottom Action Area */}
                <div className="p-4 border-t bg-gray-50 pb-[env(safe-area-inset-bottom)]">
                    {user ? (
                        <Link href={user.role === 'ADMIN' ? '/dashboard/admin' : user.role === 'INSTRUCTOR' ? '/dashboard/instructor' : '/dashboard/student/courses'} className="btn-primary w-full justify-center" onClick={closeMenu}>
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Go to Dashboard
                        </Link>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <Link href="/auth/login" className="btn-ghost justify-center w-full" onClick={closeMenu}>Login</Link>
                            <Link href="/auth/register" className="btn-primary justify-center w-full" onClick={closeMenu}>Get Started</Link>
                        </div>
                    )}
                </div>
            </div>
        </Portal>
    </header>
  );
}