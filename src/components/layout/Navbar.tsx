'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@/components/ui/Container';
import { Menu, X, LogOut, GraduationCap, LayoutDashboard, House, BookOpen, Megaphone, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Portal } from '@/components/ui/Portal';

// A link is active on an exact match, or when the current path is nested under
// it. `exact` is required for the home link, whose href is a prefix of every
// other route in the locale.
const useIsActive = (href: string, exact = false) => {
    const pathname = usePathname();
    if (exact) return pathname === href || pathname === `${href}/`;
    return pathname === href || pathname.startsWith(`${href}/`);
};

// --- Desktop nav item: text only, with a gradient underline indicator ---
const DesktopNavLink = ({ href, children, exact }: { href: string; children: React.ReactNode; exact?: boolean }) => {
    const isActive = useIsActive(href, exact);

    return (
        <Link
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`group relative px-3.5 py-2 text-[15px] font-semibold transition-colors duration-200 ${
                isActive ? 'text-blue-700' : 'text-slate-600 hover:text-slate-900'
            }`}
        >
            {children}
            <span
                aria-hidden
                className={`absolute inset-x-3 -bottom-0.5 h-0.5 origin-left rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-transform duration-300 ${
                    isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
            />
        </Link>
    );
};

// --- Mobile drawer nav item: icon + label row ---
const MobileNavLink = ({
    href,
    children,
    onClick,
    icon: Icon,
    exact,
}: { href: string; children: React.ReactNode; onClick?: () => void; icon: React.ElementType; exact?: boolean }) => {
    const isActive = useIsActive(href, exact);

    return (
        <Link
            href={href}
            onClick={onClick}
            aria-current={isActive ? 'page' : undefined}
            className={`flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 font-semibold transition-all duration-200 active:scale-[0.98] ${
                isActive
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-white'
            }`}
        >
            <span
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
                    isActive ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}
            >
                <Icon className="h-[18px] w-[18px]" />
            </span>
            <span>{children}</span>
        </Link>
    );
};

// --- User Dropdown ---
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
              className="flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/80 py-1.5 pl-1.5 pr-3 shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-bold text-white shadow-sm">
                  {(user.name || 'U').slice(0,1).toUpperCase()}
                </span>
                <span className="hidden max-w-[10rem] truncate text-sm font-semibold text-slate-800 sm:inline">{user.name}</span>
                <ChevronDown className={`hidden h-4 w-4 text-slate-400 transition-transform duration-200 sm:block ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div role="menu" aria-label="User menu" className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_45px_-15px_rgb(15_23_42_/_0.3)]">
                    <div className="border-b border-slate-100 bg-gradient-to-br from-blue-50 to-cyan-50/60 px-4 py-3.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Signed in as</p>
                        <p className="mt-1 truncate text-sm font-bold text-slate-900">{user.name}</p>
                        <span className="mt-2 inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 ring-1 ring-blue-200">
                            {user.role}
                        </span>
                    </div>
                    <div className="p-1.5">
                        <Link href={dashboardHref} role="menuitem" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"><LayoutDashboard className="h-4 w-4 text-slate-400" />Dashboard</Link>
                        <button role="menuitem" onClick={logout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"><LogOut className="h-4 w-4" />Logout</button>
                    </div>
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
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyPosition = document.body.style.position;

    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = '0';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = originalBodyOverflow || '';
      document.documentElement.style.overflow = originalHtmlOverflow || '';
      document.body.style.position = originalBodyPosition || '';
      document.body.style.top = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow || '';
      document.documentElement.style.overflow = originalHtmlOverflow || '';
      document.body.style.position = originalBodyPosition || '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
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
      className={`sticky top-0 z-50 backdrop-blur-xl transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 shadow-[0_10px_30px_-18px_rgb(15_23_42_/_0.45)]'
          : 'bg-white/75'
      }`}
    >
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 bg-white text-blue-600 rounded-lg shadow-lg">Skip to main content</a>
      <Container>
        <div className="flex h-20 items-center justify-between gap-4 px-2 md:px-0">
          <Link href={`/${locale}`} className="inline-flex shrink-0 items-center gap-2 transition-opacity duration-200 hover:opacity-85" onClick={() => isMenuOpen && closeMenu()}>
            {/* Intrinsic size is 1485x611 (2.43:1). Declare it truthfully and let
                CSS set the display height, or the mark renders squashed. */}
            <Image
                src="/logo.png"
                alt="Online Thakshilawa"
                width={1485}
                height={611}
                sizes="160px"
                priority
                className="h-10 w-auto sm:h-11"
            />
          </Link>

          {/* --- Desktop Navigation --- */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            <DesktopNavLink href={`/${locale}`} exact>Home</DesktopNavLink>
            <DesktopNavLink href={`/${locale}/courses`}>Courses</DesktopNavLink>
            <DesktopNavLink href={`/${locale}/pastpapers`}>Past papers</DesktopNavLink>
            <DesktopNavLink href={`/${locale}/announcements`}>Announcements</DesktopNavLink>
          </nav>

          {/* Right side content */}
          <div className="flex items-center justify-end gap-3">
            {/* Desktop auth/user section */}
            <div className="hidden items-center gap-3 md:flex">
              {isLoading ? (
                <div className="h-10 w-28 animate-pulse rounded-full bg-slate-200" />
              ) : user ? (
                <>
                  <UserDropdown user={user} logout={logout} />
                  <span aria-hidden className="h-6 w-px bg-slate-200" />
                  <LanguageSwitcher />
                </>
              ) : (
                <>
                  <Link href={`/${locale}/auth/login`} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900">
                    Login
                  </Link>
                  <Link
                    href={`/${locale}/auth/register`}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_6px_20px_-6px_rgb(37_99_235_/_0.9)] transition-all duration-300 hover:shadow-[0_10px_28px_-6px_rgb(37_99_235_/_1)]"
                  >
                    <span
                      aria-hidden
                      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                    />
                    <span className="relative">Get Started</span>
                  </Link>
                  <span aria-hidden className="h-6 w-px bg-slate-200" />
                  <LanguageSwitcher />
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="ml-auto md:hidden">
              <button
                ref={triggerRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                type="button"
                aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu-panel"
                className={`relative rounded-xl border p-3 shadow-sm transition-all duration-300 active:scale-90 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                  isMenuOpen
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <span className="relative flex h-6 w-6 items-center justify-center">
                  <Menu className={`absolute h-5 w-5 transition-all duration-300 ${isMenuOpen ? 'scale-75 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'}`} />
                  <X className={`absolute h-5 w-5 transition-all duration-300 ${isMenuOpen ? 'scale-100 rotate-0 opacity-100' : 'scale-75 -rotate-90 opacity-0'}`} />
                </span>
              </button>
            </div>
          </div>
        </div>
      </Container>

      {/* Brand hairline along the bottom edge */}
      <div
        aria-hidden
        className={`h-px w-full bg-gradient-to-r from-transparent via-blue-500/50 to-transparent transition-opacity duration-300 ${
          isScrolled ? 'opacity-100' : 'opacity-40'
        }`}
      />

      {/* --- Mobile Menu --- */}
      <Portal>
        {/* Backdrop Overlay */}
        <div
          className={`fixed inset-0 z-[60] bg-slate-950/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
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
          className={`fixed bottom-0 right-0 top-0 z-[70] flex w-full max-w-sm flex-col border-l border-white/40 bg-slate-50 shadow-2xl transition-transform duration-300 ease-out md:hidden ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="relative isolate overflow-hidden border-b border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-6 py-6">
            <div aria-hidden className="landing-orb -left-16 -top-16 h-48 w-48 bg-blue-500/40" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300">Online Thakshilawa</p>
                <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-white">Menu</h2>
              </div>
              <button
                ref={closeBtnRef}
                onClick={closeMenu}
                aria-label="Close menu"
                className="group rounded-xl border border-white/20 bg-white/10 p-2.5 text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 active:scale-90"
              >
                <X className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-grow overflow-y-auto px-5 py-6">
            <p className="mb-3 px-1 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Explore</p>
            <div className="space-y-1.5">
              <MobileNavLink href={`/${locale}`} icon={House} onClick={closeMenu} exact>Home</MobileNavLink>
              <MobileNavLink href={`/${locale}/courses`} icon={BookOpen} onClick={closeMenu}>Courses</MobileNavLink>
              <MobileNavLink href={`/${locale}/pastpapers`} icon={GraduationCap} onClick={closeMenu}>Past papers</MobileNavLink>
              <MobileNavLink href={`/${locale}/announcements`} icon={Megaphone} onClick={closeMenu}>Announcements</MobileNavLink>
            </div>
          </nav>

          {/* Bottom Action Area */}
          <div className="border-t border-slate-200 bg-white p-5">
            <div className="mb-4 space-y-2.5">
              {user ? (
                <>
                  <Link
                    href={user?.role === 'ADMIN'
                      ? `/${locale}/dashboard/admin`
                      : user?.role === 'INSTRUCTOR'
                        ? `/${locale}/dashboard/instructor`
                        : `/${locale}/dashboard/student/courses`}
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3.5 font-bold text-white shadow-[0_8px_25px_-8px_rgb(37_99_235_/_0.9)] transition-all duration-200 active:scale-[0.98]"
                    onClick={closeMenu}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => { closeMenu(); logout(); }}
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-6 py-3.5 font-bold text-red-700 transition-all duration-200 hover:bg-red-100 active:scale-[0.98]"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={`/${locale}/auth/register`}
                    className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3.5 font-bold text-white shadow-[0_8px_25px_-8px_rgb(37_99_235_/_0.9)] transition-all duration-200 active:scale-[0.98]"
                    onClick={closeMenu}
                  >
                    Get Started
                  </Link>
                  <Link
                    href={`/${locale}/auth/login`}
                    className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-bold text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
                    onClick={closeMenu}
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-sm font-semibold text-slate-600">Language</span>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </Portal>
    </header>
  );
}
