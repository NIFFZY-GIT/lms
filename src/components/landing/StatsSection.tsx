"use client";

import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Container';

export default function StatsSection() {
  const t = useTranslations('LandingPage.Stats');
  const statsData = t.raw('stats') as { value: string; label: string }[];

  return (
    // This outer section now just provides spacing
    <section className="py-12 sm:py-20">
      <Container>
        {/* This is the "Floating Island" container */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900 py-20 px-8 text-white rounded-[3rem] md:rounded-[4rem] shadow-2xl">
          
          {/* Optional: Subtle background pattern for texture */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[url('/patterns/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"
          />

          <div className="relative z-10">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">{t('title')}</h2>
              <p className="text-xl text-sky-200/90">{t('subtitle')}</p>
            </div>
            
            {/* The stats are now inside individual rounded cards */}
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {statsData.map((stat, index) => (
                <div
                  key={index}
                  className="text-center p-8 bg-white/5 border border-sky-300/20 rounded-3xl backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-sky-300/50 hover:scale-105"
                >
                  <p className="font-display text-5xl md:text-6xl font-extrabold text-sky-300 drop-shadow-lg">
                    {stat.value}
                  </p>
                  <p className="mt-3 text-lg font-medium text-sky-200">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}