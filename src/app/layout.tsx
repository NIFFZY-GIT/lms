import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/providers"; // We will create this next
import { AuthProvider } from '@/context/AuthContext'; // Import the provider
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LMS Platform",
  description: "A modern learning management system",
};

// ... your other imports


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <Providers> {/* Your react-query provider */}
          <AuthProvider> {/* Wrap with AuthProvider */}
            <Navbar />
            <div className="flex-grow">{children}</div>
            <Footer />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}