"use client";

import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Container';
import { BookOpen, MonitorPlay, Users, Award } from 'lucide-react';

// A fixed hue per card slot — assigned in order, never cycled.
const ACCENTS = [
  { tile: 'from-blue-500 to-blue-600', glow: 'shadow-blue-500/30', bar: 'from-blue-500 to-cyan-400' },
  { tile: 'from-violet-500 to-purple-600', glow: 'shadow-violet-500/30', bar: 'from-violet-500 to-fuchsia-400' },
  { tile: 'from-cyan-500 to-teal-500', glow: 'shadow-cyan-500/30', bar: 'from-cyan-500 to-emerald-400' },
  { tile: 'from-amber-500 to-orange-500', glow: 'shadow-amber-500/30', bar: 'from-amber-500 to-orange-400' },
];

export default function FeatureGridSection() {
  const t = useTranslations('LandingPage.FeatureGrid');
  const featuresData = t.raw('features') as { title: string; description: string }[];
  const icons = [BookOpen, MonitorPlay, Users, Award];

  return (
    <section className="relative isolate overflow-hidden bg-white py-20 sm:py-28">
      <div aria-hidden className="landing-orb -left-40 top-10 h-96 w-96 bg-blue-200/40" />
      <div aria-hidden className="landing-orb -right-40 bottom-0 h-96 w-96 bg-cyan-200/40" />

      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="landing-heading font-display">{t('title')}</h2>
          <p className="landing-sub mt-5">{t('subtitle')}</p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuresData.map((feature, index) => {
            const Icon = icons[index];
            const accent = ACCENTS[index % ACCENTS.length];
            return (
              <div key={feature.title} className="landing-card group flex flex-col p-7">
                {/* Accent bar reveals on hover */}
                <span
                  aria-hidden
                  className={`absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r ${accent.bar} transition-transform duration-300 group-hover:scale-x-100`}
                />
                <span
                  className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${accent.tile} text-white shadow-lg ${accent.glow} transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110`}
                >
                  <Icon className="h-7 w-7" />
                </span>
                <h3 className="mt-6 text-lg font-bold leading-snug text-slate-900">{feature.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
