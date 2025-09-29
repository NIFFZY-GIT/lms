import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
// Navbar and Footer are provided by localized layout
import { Providers } from "@/components/providers"; // We will create this next
import { AuthProvider } from '@/context/AuthContext'; // Import the provider
// AutoLogoutIndicator is provided in localized layout when needed

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
            {/* Leave chrome to localized layout which will provide IntlProvider */}
            <main id="main-content" className="flex-grow focus:outline-none">{children}</main>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}