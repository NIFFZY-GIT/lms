import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Noto_Sans_Sinhala } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: '--font-jakarta' });
const sinhala = Noto_Sans_Sinhala({ subsets: ["sinhala"], variable: '--font-sinhala' });

export const metadata: Metadata = {
  title: "Online Thakshilawa | Grade 10, O/L and school study resources",
  description: "Online Thakshilawa offers structured learning for Grade 10, O/L, past papers, quizzes, and study support for Sri Lankan students.",
  keywords: ["online classes", "Sri Lanka education", "Grade 10", "O/L", "past papers", "study resources"],
  alternates: {
    canonical: "https://onlinethakshilawa.lk"
  },
  openGraph: {
    title: "Online Thakshilawa | Grade 10, O/L and school study resources",
    description: "Structured online lessons, practice quizzes, and past papers for Sri Lankan students.",
    url: "https://onlinethakshilawa.lk",
    siteName: "Online Thakshilawa",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable} ${inter.variable} ${sinhala.variable}`}>
      <head>
        <meta name="google-adsense-account" content="ca-pub-4147783548079095" />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4147783548079095"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="font-sans flex min-h-screen flex-col overflow-x-hidden">
        {/* Locale layout provides app-level providers and chrome. */}
        <main id="main-content" className="flex-1 w-full focus:outline-none">{children}</main>
      </body>
    </html>
  );
}