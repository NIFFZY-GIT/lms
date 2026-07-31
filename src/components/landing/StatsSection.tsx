"use client";

import { useLocale, useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Container';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function StatsSection() {
  const t = useTranslations('LandingPage.Stats');
  const hero = useTranslations('LandingPage.Hero');
  const locale = useLocale();
  const statsData = t.raw('stats') as { value: string; label: string }[];

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 py-20 sm:py-28">
      {/* Texture + brand blooms, all decorative */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[url('/patterns/grid.svg')] bg-center opacity-30 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]"
      />
      <div aria-hidden className="landing-orb left-1/2 top-[-20%] h-80 w-[45rem] -translate-x-1/2 bg-blue-500/30" />
      <div aria-hidden className="landing-orb bottom-[-25%] right-[-10%] h-80 w-80 bg-cyan-400/25" />

      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-white text-balance sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-slate-300 text-pretty sm:text-lg">{t('subtitle')}</p>
        </div>

        <dl className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {statsData.map((stat) => (
            <div
              key={stat.label}
              className="group rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-8 text-center shadow-[0_18px_40px_-20px_rgb(2_6_23_/_0.9)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-sky-300/40 hover:bg-white/[0.12]"
            >
              <dt className="bg-gradient-to-br from-white via-sky-100 to-cyan-300 bg-clip-text font-display text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
                {stat.value}
              </dt>
              <dd className="mt-3 text-sm font-medium text-slate-300">{stat.label}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-14 flex justify-center">
          <Link
            href={`/${locale}/auth/register`}
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-400 px-9 py-4 text-base font-bold text-slate-950 shadow-[0_14px_45px_-12px_rgb(56_189_248_/_0.8)] transition-all duration-300 hover:shadow-[0_18px_55px_-10px_rgb(56_189_248_/_1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <span
              aria-hidden
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-700 group-hover:translate-x-full"
            />
            <span className="relative">{hero('ctaPrimary')}</span>
            <ArrowRight className="relative h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
