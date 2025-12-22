import { IntlProvider } from '../../components/IntlProvider';
import type { Metadata } from "next";
import '@/app/globals.css';
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/providers";
import { AuthProvider } from '@/context/AuthContext';
import { AutoLogoutIndicator } from '@/components/ui/AutoLogoutIndicator';

export const metadata: Metadata = {
  title: "Online Thakshilawa",
  description: "Sri Lanka’s First and Best Online Classes",
};

export default async function RootLayout({ children, params }: { children: React.ReactNode, params: Promise<{ locale: string }> }) {
  // `params` is a promise in Next.js 15; await it
  const { locale: localeParam } = await params;
  const locale = localeParam || 'en';
  // Load messages directly from the JSON files in src/messages to avoid requiring next-intl config at runtime.
  let messages = {};
  try {
    // dynamic import so Next will include the JSON files in the server bundle
    // relative path: src/app/[locale]/layout.tsx -> ../../messages/{locale}.json
    // use .default for ESM JSON modules
  const mod = await import(`../../messages/${locale}.json`);
    messages = mod?.default ?? mod ?? {};
  } catch (err) {
    // If messages are missing, fall back to empty messages to avoid crashing the app
    console.warn(`Could not load messages for locale: ${locale}`, err);
    messages = {};
  }

  return (
    <IntlProvider locale={locale} messages={messages}>
      <Providers>
        <AuthProvider>
          <Navbar />
          <AutoLogoutIndicator />
          <main id="main-content" className="flex-grow focus:outline-none">{children}</main>
          <Footer />
        </AuthProvider>
      </Providers>
    </IntlProvider>
  );
}
