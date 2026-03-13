import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Noto_Sans_Sinhala } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: '--font-jakarta' });
const sinhala = Noto_Sans_Sinhala({ subsets: ["sinhala"], variable: '--font-sinhala' });

export const metadata: Metadata = {
  title: "Online Thakshilawa",
  description: "Sri Lanka’s First and Best Online Classes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable} ${inter.variable} ${sinhala.variable}`}>
      <body className={`font-sans flex flex-col min-h-screen`}>
        {/* Locale layout provides app-level providers and chrome. */}
        <main id="main-content" className="flex-grow focus:outline-none">{children}</main>
      </body>
    </html>
  );
}