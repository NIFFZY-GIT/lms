'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const handleSwitch = (newLocale: 'en' | 'si') => {
    // This removes the current locale from the pathname
    const newPath = pathname.startsWith(`/${locale}`) ? pathname.substring(3) : pathname;
    router.replace(`/${newLocale}${newPath}`);
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
      <button
        onClick={() => handleSwitch('en')}
        disabled={locale === 'en'}
        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
          locale === 'en'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-slate-600 hover:bg-slate-200'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => handleSwitch('si')}
        disabled={locale === 'si'}
        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
          locale === 'si'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-slate-600 hover:bg-slate-200'
        }`}
      >
        සිං
      </button>
    </div>
  );
}
