// src/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar'; // Make sure your Navbar component is imported

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Online Thakshilawa',
  description: 'Unlock Your Potential with Our Expert-Led Courses',
};

// The layout now accepts 'params' which will contain the 'lang' property
export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string }; // Add this type for params
}) {
  return (
    // Pass the lang parameter to the html tag
    <html lang={params.lang}>
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          {/* You can add a Footer component here if you have one */}
        </AuthProvider>
      </body>
    </html>
  );
}