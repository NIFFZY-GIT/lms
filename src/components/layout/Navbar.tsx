'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@/components/ui/Container';
import { Menu, X, LogOut, LayoutDashboard, House, BookOpen, Megaphone } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Portal } from '@/components/ui/Portal';

// --- Reusable NavLink Component (Modern "Pill" Style) ---
const NavLink = ({ href, children, onClick, icon: Icon }: { href: string; children: React.ReactNode; onClick?: () => void; icon?: React.ElementType }) => {
    const pathname = usePathname();
    // More robust check for active link, e.g., /courses should match /courses/some-course
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

    return (
        <Link
            href={href}
            onClick={onClick}
            className={`
                flex items-center gap-2.5 transition-all duration-200
                w-full md:w-auto px-4 py-3 md:px-3 md:py-2 rounded-lg font-medium
                ${isActive
                    ? 'bg-blue-100 text-blue-600' // Active state: light blue background, dark blue text
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' // Default state
                }
            `}
        >
            {Icon && <Icon className="w-5 h-5 opacity-80" />}
            <span>{children}</span>
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
    // Get current locale from pathname (assumes /:locale/...)
    const pathname = usePathname();
    const localeMatch = /^\/([a-zA-Z-]+)(\/|$)/.exec(pathname);
    const locale = localeMatch ? localeMatch[1] : 'en';
    const dashboardHref = user?.role === 'ADMIN'
      ? `/${locale}/dashboard/admin`
      : user?.role === 'INSTRUCTOR'
        ? `/${locale}/dashboard/instructor`
        : `/${locale}/dashboard/student/courses`;
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
              className="flex items-center gap-2 rounded-full px-2 py-1.5 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                <span className="bg-blue-600 text-white rounded-full h-9 w-9 inline-flex items-center justify-center text-sm font-semibold">
                  {(user.name || 'U').slice(0,1).toUpperCase()}
                </span>
                <span className="hidden sm:inline font-medium text-slate-800">{user.name}</span>
            </button>
            {isOpen && (
                <div role="menu" aria-label="User menu" className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 z-50 border border-slate-200/80">
                    <div className="px-4 pb-2 text-xs text-slate-500">Signed in as</div>
                    <div className="px-4 pb-2 text-sm font-medium text-slate-800 border-b border-slate-200/80 mb-2">{user.name}</div>
                    <Link href={dashboardHref} role="menuitem" className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"><LayoutDashboard className="w-4 h-4 mr-2" />Dashboard</Link>
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
  // Get current locale from pathname (assumes /:locale/...)
  const localeMatch = /^\/([a-zA-Z-]+)(\/|$)/.exec(pathname);
  const locale = localeMatch ? localeMatch[1] : 'en';

  // Redirect to locale-aware dashboard if user lands on non-locale dashboard URLs
  useEffect(() => {
    if (/^\/dashboard\/.*/.test(pathname) && !/^\/[a-zA-Z-]+\//.test(pathname)) {
      window.location.replace(`/${locale}${pathname}`);
    }
  }, [pathname, locale]);

  const closeMenu = () => setIsMenuOpen(false);

  // All your excellent useEffect hooks for accessibility and state management are preserved.
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
    <header 
      ref={headerRef} 
      className={`sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-white/80 shadow-md border-b border-slate-200/80' : 'bg-white/60'} backdrop-blur-xl`}
      style={{ borderRadius: '0 0 1.5rem 1.5rem' }}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 bg-white text-blue-600 rounded-lg shadow-lg">Skip to main content</a>
      <Container>
        <div className="flex items-center justify-between h-20 px-2 md:px-0">
          <Link href={`/${locale}`} className="inline-flex shrink-0 items-center gap-2" onClick={() => isMenuOpen && closeMenu()}>
            <Image
                src="/logo.png"
                alt="Online Thakshilawa Logo"
                width={140} height={40}
                priority
            />
          </Link>

          {/* --- Desktop Navigation --- */}
          <nav className="hidden md:flex items-center space-x-2 text-base" aria-label="Primary">
            <NavLink href={`/${locale}`} icon={House}>Home</NavLink>
            <NavLink href={`/${locale}/courses`} icon={BookOpen}>Courses</NavLink>
            <NavLink href={`/${locale}/announcements`} icon={Megaphone}>Announcements</NavLink>
          </nav>

          <div className="flex items-center space-x-4 w-full md:w-auto">
            {isLoading ? (
              <div className="w-24 h-10 bg-slate-200 rounded-full animate-pulse" />
            ) : user ? (
                <UserDropdown user={user} logout={logout} />
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link href={`/${locale}/auth/login`} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 transition-colors">Login</Link>
                <Link href={`/${locale}/auth/register`} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md transition">Get Started</Link>
                {/* LanguageSwitcher sits after register button, at far right */}
                <div className="ml-4 flex items-center">
                  <LanguageSwitcher />
                </div>
              </div>
            )}
            {/* For logged-in users, show LanguageSwitcher at far right */}
            {!user && <div className="md:hidden ml-2"><LanguageSwitcher /></div>}
            <div className="md:hidden">
              <button
                ref={triggerRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                type="button"
                aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu-panel"
                className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 shadow-sm"
              >
                {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
              </button>
            </div>
          </div>
        </div>
      </Container>
      
      {/* --- Modern Mobile Menu --- */}
      <Portal>
        {/* Backdrop Overlay */}
        <div
          className={`fixed inset-0 bg-black/50 md:hidden transition-opacity duration-300 ease-in-out ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
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
          className={`fixed top-0 bottom-0 right-0 w-full max-w-sm bg-white/95 backdrop-blur-xl shadow-2xl md:hidden flex flex-col transition-transform duration-300 ease-in-out border-l border-slate-200/80 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-200/80">
            <span className="font-semibold text-slate-800 text-lg">Menu</span>
            <button
              ref={closeBtnRef}
              onClick={closeMenu}
              aria-label="Close menu"
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 shadow-sm"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {/* Navigation Links */}
          <nav className="flex-grow p-4 space-y-2">
            <NavLink href={`/${locale}`} icon={House} onClick={closeMenu}>Home</NavLink>
            <NavLink href={`/${locale}/courses`} icon={BookOpen} onClick={closeMenu}>Courses</NavLink>
            <NavLink href={`/${locale}/announcements`} icon={Megaphone} onClick={closeMenu}>Announcements</NavLink>
          </nav>
          {/* Bottom Action Area */}
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/70 pb-[env(safe-area-inset-bottom)]">
            {user ? (
              <Link href={user?.role === 'ADMIN'
                ? `/${locale}/dashboard/admin`
                : user?.role === 'INSTRUCTOR'
                  ? `/${locale}/dashboard/instructor`
                  : `/${locale}/dashboard/student/courses`} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-sm hover:shadow-md transition" onClick={closeMenu}>
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link href={`/${locale}/auth/login`} className="w-full flex justify-center px-4 py-3 rounded-lg font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition" onClick={closeMenu}>Login</Link>
                <Link href={`/${locale}/auth/register`} className="w-full flex justify-center px-4 py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md transition" onClick={closeMenu}>Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </Portal>
    </header>
  );
}