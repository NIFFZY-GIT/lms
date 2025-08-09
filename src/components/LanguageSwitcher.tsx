// src/components/LanguageSwitcher.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';

// Define props to accept a variant and optional button text
interface LanguageSwitcherProps {
  variant?: 'default' | 'button';
  buttonText?: string;
}

export function LanguageSwitcher({ variant = 'default', buttonText }: LanguageSwitcherProps) {
  const pathname = usePathname();
  
  if (!pathname) return null; // Don't render if path is not available yet

  const currentLocale = pathname.split('/')[1];

  const getPathForLocale = (locale: string) => {
    const segments = pathname.split('/');
    segments[1] = locale;
    return segments.join('/');
  };

  // --- RENDER THE BUTTON VARIANT ---
  if (variant === 'button') {
    const targetLocale = currentLocale === 'en' ? 'si' : 'en';
    return (
      <Link
        href={getPathForLocale(targetLocale)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-white border border-indigo-200 rounded-md shadow-sm hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
      >
        <Globe className="w-4 h-4" />
        {buttonText || `View in ${targetLocale.toUpperCase()}`}
      </Link>
    );
  }

  // --- RENDER THE DEFAULT (Navbar) VARIANT ---
  return (
    <div className="flex items-center space-x-2 text-sm bg-white/80 backdrop-blur-sm p-2 rounded-lg">
      <Link href={getPathForLocale('en')} passHref>
        <span className={`cursor-pointer p-1 rounded-md ${currentLocale === 'en' ? 'font-bold text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-900'}`}>
          EN
        </span>
      </Link>
      <span className="text-gray-300">|</span>
      <Link href={getPathForLocale('si')} passHref>
        <span className={`cursor-pointer p-1 rounded-md ${currentLocale === 'si' ? 'font-bold text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-900'}`}>
          SI
        </span>
      </Link>
    </div>
  );
}