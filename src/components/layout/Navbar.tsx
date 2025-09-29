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
                flex items-center gap-3 transition-all duration-300
                w-full md:w-auto px-4 py-3.5 md:px-3 md:py-2 rounded-xl font-semibold
                relative overflow-hidden group
                ${isActive
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100/80 text-blue-700 shadow-sm border border-blue-200/50' // Active state
                    : 'text-slate-600 hover:bg-white/60 hover:text-slate-900 hover:shadow-sm backdrop-blur-sm border border-transparent hover:border-slate-200/50' // Default state
                }
            `}
        >
            {Icon && (
                <div className={`relative z-10 transition-all duration-300 ${
                    isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'
                }`}>
                    <Icon className="w-5 h-5" />
                </div>
            )}
            <span className="relative z-10">{children}</span>
            {/* Hover effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-50/50 to-blue-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
      className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 shadow-md border-b border-slate-200/80' : 'bg-white/60'} backdrop-blur-xl`}
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

          {/* Right side content */}
          <div className="flex items-center justify-end space-x-4">
            {/* Desktop auth/user section */}
            <div className="hidden md:flex items-center space-x-4">
              {isLoading ? (
                <div className="w-24 h-10 bg-slate-200 rounded-full animate-pulse" />
              ) : user ? (
                <div className="flex items-center space-x-4">
                  <UserDropdown user={user} logout={logout} />
                  {/* LanguageSwitcher for logged-in users on desktop */}
                  <div className="flex items-center">
                    <LanguageSwitcher />
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href={`/${locale}/auth/login`} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 transition-colors">Login</Link>
                  <Link href={`/${locale}/auth/register`} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md transition">Get Started</Link>
                  {/* LanguageSwitcher sits after register button, at far right */}
                  <div className="ml-4 flex items-center">
                    <LanguageSwitcher />
                  </div>
                </div>
              )}
            </div>
            
            {/* Mobile menu button - positioned at far right */}
            <div className="md:hidden ml-auto">
              <button
                ref={triggerRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                type="button"
                aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu-panel"
                className={`relative p-3.5 rounded-2xl backdrop-blur-xl border text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 shadow-xl transition-all duration-300 active:scale-90 group overflow-hidden ${
                  isMenuOpen 
                    ? 'bg-blue-50/90 border-blue-200/80 text-blue-700 shadow-blue-200/50' 
                    : 'bg-white/85 border-slate-200/70 hover:bg-white/95 hover:border-slate-300/80 hover:shadow-2xl'
                }`}
              >
                {/* Animated background */}
                <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-blue-600/10 transition-opacity duration-300 ${
                  isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                }`} />
                
                {/* Icon container with better animations */}
                <div className="relative w-6 h-6 flex items-center justify-center">
                  <Menu className={`absolute w-5 h-5 transition-all duration-500 ease-out transform ${
                    isMenuOpen 
                      ? 'opacity-0 rotate-180 scale-0' 
                      : 'opacity-100 rotate-0 scale-100'
                  }`} />
                  <X className={`absolute w-5 h-5 transition-all duration-500 ease-out transform ${
                    isMenuOpen 
                      ? 'opacity-100 rotate-0 scale-100' 
                      : 'opacity-0 -rotate-180 scale-0'
                  }`} />
                </div>
                
                {/* Ripple effect */}
                <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                  isMenuOpen ? 'bg-blue-400/20 animate-ping' : ''
                }`} style={{ animationDuration: '1s', animationIterationCount: '1' }} />
              </button>
            </div>
          </div>
        </div>
      </Container>
      
      {/* --- Modern Mobile Menu --- */}
      <Portal>
        {/* Backdrop Overlay */}
        <div
          className={`fixed inset-0 z-[60] bg-gradient-to-br from-slate-900/60 via-slate-800/50 to-slate-900/70 backdrop-blur-sm md:hidden transition-all duration-500 ease-out ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
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
          className={`fixed top-0 bottom-0 right-0 w-full max-w-sm z-[70] backdrop-blur-3xl shadow-2xl md:hidden flex flex-col transition-all duration-500 ease-out border-l border-white/30 ${
            isMenuOpen 
              ? 'translate-x-0' 
              : 'translate-x-full'
          }`}
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 30%, rgba(241,245,249,0.96) 70%, rgba(248,250,252,0.98) 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
          }}
        >
          {/* Modern Header */}
          <div className="relative p-6 pb-4">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/80 via-transparent to-purple-50/80" />
            
            <div className="relative flex items-center justify-between">
              {/* Brand section */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-ping opacity-30" />
                </div>
                <div>
                  <h2 className="font-black text-slate-800 text-xl tracking-tight">Menu</h2>
                  <p className="text-xs text-slate-500 font-medium">Navigate with ease</p>
                </div>
              </div>
              
              {/* Close button */}
              <button
                ref={closeBtnRef}
                onClick={closeMenu}
                aria-label="Close menu"
                className="relative p-3 rounded-2xl bg-white/70 hover:bg-white/90 text-slate-600 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all duration-300 active:scale-90 group backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl"
              >
                <X className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-50/0 to-red-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
            
            {/* Decorative line */}
            <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />
          </div>
          {/* Enhanced Navigation Links */}
          <nav className="flex-grow px-6 py-6 space-y-6">
            {/* Main Navigation Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Explore</p>
              </div>
              
              <div className="space-y-2">
                <NavLink href={`/${locale}`} icon={House} onClick={closeMenu}>Home</NavLink>
                <NavLink href={`/${locale}/courses`} icon={BookOpen} onClick={closeMenu}>Courses</NavLink>
                <NavLink href={`/${locale}/announcements`} icon={Megaphone} onClick={closeMenu}>Announcements</NavLink>
              </div>
            </div>
            
            {/* Quick Stats or Info Section */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-purple-50/80 border border-blue-100/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/70 backdrop-blur-sm">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Start Learning</p>
                  <p className="text-xs text-slate-600">Explore courses & grow your skills</p>
                </div>
              </div>
            </div>
          </nav>
          {/* Enhanced Bottom Action Area */}
          <div className="p-6 mt-auto">
            {/* Action buttons */}
            <div className="space-y-3 mb-6">
              {user ? (
                <Link 
                  href={user?.role === 'ADMIN'
                    ? `/${locale}/dashboard/admin`
                    : user?.role === 'INSTRUCTOR'
                      ? `/${locale}/dashboard/instructor`
                      : `/${locale}/dashboard/student/courses`} 
                  className="group w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95 relative overflow-hidden" 
                  onClick={closeMenu}
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <LayoutDashboard className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                  <span className="relative z-10">Dashboard</span>
                  <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 group-active:opacity-30 transition-opacity duration-200" />
                </Link>
              ) : (
                <>
                  <Link 
                    href={`/${locale}/auth/login`} 
                    className="group w-full flex justify-center items-center gap-3 px-6 py-4 rounded-2xl font-bold text-slate-700 bg-white/90 border-2 border-slate-200/60 hover:bg-white hover:border-slate-300/80 hover:shadow-lg transition-all duration-300 active:scale-95 backdrop-blur-sm relative overflow-hidden" 
                    onClick={closeMenu}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10">Sign In</span>
                  </Link>
                  
                  <Link 
                    href={`/${locale}/auth/register`} 
                    className="group w-full flex justify-center items-center gap-3 px-6 py-4 rounded-2xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95 relative overflow-hidden" 
                    onClick={closeMenu}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10">Get Started</span>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                  </Link>
                </>
              )}
            </div>
            
            {/* Language switcher with modern design */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50/80 via-white/70 to-slate-50/80 backdrop-blur-sm border border-white/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium text-slate-700">Language</span>
                </div>
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>
      </Portal>
    </header>
  );
}