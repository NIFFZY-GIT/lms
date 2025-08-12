import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/providers"; // We will create this next
import { AuthProvider } from '@/context/AuthContext'; // Import the provider

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: '--font-jakarta' });

export const metadata: Metadata = {
  title: "Online Thakshilawa",
  description: "Sri Lanka’s First and Best Online Classes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable} ${inter.variable}`}>
      <body className={`font-sans flex flex-col min-h-screen`}>
        <Providers>
          <AuthProvider>
            <Navbar />
            <div className="flex-grow">{children}</div>
            <Footer />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}