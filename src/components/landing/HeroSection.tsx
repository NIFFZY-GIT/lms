"use client";

import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Container';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  const t = useTranslations('LandingPage.Hero');
  return (
    <section className="relative h-[91vh] flex items-center justify-center text-white overflow-hidden">
      <video src="/videos/v1.mp4" autoPlay loop muted playsInline aria-hidden className="absolute top-0 left-0 w-full h-full object-cover z-0 pointer-events-none scale-105" />
      <div aria-hidden className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/80 via-blue-700/60 to-transparent z-10" />
      <Container className="relative z-20 pt-16 text-center animate-fade-in">
        <h1
          className="font-display text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-lg mb-6 leading-tight"
          dangerouslySetInnerHTML={{ __html: t.raw('title') }}
        />
        <p className="mt-6 max-w-3xl mx-auto text-xl text-sky-100/90 font-medium drop-shadow">{t('subtitle')}</p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/en/auth/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 text-lg font-bold text-white shadow-xl hover:scale-105 transition-transform duration-200 group">
            {t('ctaPrimary')} <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/en/courses" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-white text-lg font-bold text-white shadow-xl hover:scale-105 hover:bg-white/20 transition-transform duration-200">
            {t('ctaSecondary')}
          </Link>
        </div>
      </Container>
    </section>
  );
}
