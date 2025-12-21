// components/layout/LayoutWrapper.tsx
'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AutoLogoutIndicator } from '@/components/ui/AutoLogoutIndicator';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Check if it's an auth page
  const isAuthPage = pathname?.includes('/auth/');

  if (isAuthPage) {
    // Auth pages have their own full-screen layout with integrated footer
    return (
      <>
        <Navbar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <AutoLogoutIndicator />
      <main id="main-content" className="flex-grow focus:outline-none min-h-[80vh]">
        {children}
      </main>
      <Footer />
    </>
  );
}