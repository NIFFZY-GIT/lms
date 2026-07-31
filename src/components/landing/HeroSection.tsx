"use client";

import { useLocale, useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Container';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, PlayCircle, Sparkles } from 'lucide-react';
import { VideoBackdrop } from '@/components/ui/VideoBackdrop';

export default function HeroSection() {
  const t = useTranslations('LandingPage.Hero');
  const stats = useTranslations('LandingPage.Stats');
  const locale = useLocale();

  // Reuse the existing stats copy as an inline credibility strip.
  const trustStats = (stats.raw('stats') as { value: string; label: string }[]).slice(0, 3);

  return (
    <section className="relative isolate flex min-h-[min(48rem,calc(100svh-4rem))] items-center overflow-hidden bg-slate-950">
      {/* Backdrop: the still paints first, the video fades in over it once ready */}
      <Image
        src="/images/p6.jpg"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-30 object-cover animate-slow-zoom"
      />
      <VideoBackdrop src="/images/v1.mp4" className="absolute inset-0 -z-30 h-full w-full" />

      {/* Colour grade: deep navy at the copy edge, clearing across the image */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-gradient-to-r from-slate-950/95 via-blue-950/75 to-indigo-950/40"
      />
      {/* Mesh blooms give the flat photo depth and brand colour */}
      <div aria-hidden className="landing-orb -left-32 top-[-10%] h-[34rem] w-[34rem] bg-blue-600/40 -z-20" />
      <div aria-hidden className="landing-orb bottom-[-20%] right-[-10%] h-[30rem] w-[30rem] bg-cyan-400/25 -z-20" />
      {/* Fine grid texture */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[url('/patterns/grid.svg')] bg-center opacity-25 [mask-image:radial-gradient(ellipse_at_30%_50%,white,transparent_70%)]"
      />
      {/* Resolve cleanly into the next section */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-white" />

      <Container className="relative py-24 sm:py-28">
        <div className="max-w-3xl text-center lg:text-left">
          <span className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-sky-100 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Online Thakshilawa.lk
          </span>

          <h1
            className="animate-fade-up mt-6 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white text-balance [text-shadow:0_2px_30px_rgb(2_6_23_/_0.5)] sm:text-5xl lg:text-6xl"
            dangerouslySetInnerHTML={{ __html: t.raw('title') }}
          />

          <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-200/90 text-pretty sm:text-lg lg:mx-0 [animation-delay:120ms]">
            {t('subtitle')}
          </p>

          <div className="animate-fade-up mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start [animation-delay:200ms]">
            <Link
              href={`/${locale}/auth/register`}
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-8 py-4 text-base font-bold text-white shadow-[0_10px_40px_-10px_rgb(37_99_235_/_0.9)] transition-all duration-300 hover:shadow-[0_14px_50px_-8px_rgb(37_99_235_/_1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              {/* Sheen sweep on hover */}
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
              />
              <span className="relative">{t('ctaPrimary')}</span>
              <ArrowRight className="relative h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>

            <Link
              href={`/${locale}/courses`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur-md transition-all duration-300 hover:border-white/50 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <PlayCircle className="h-5 w-5 text-sky-300" />
              {t('ctaSecondary')}
            </Link>
          </div>

          {/* Floating glass credibility cards */}
          <dl className="animate-fade-up mx-auto mt-14 grid max-w-xl grid-cols-3 gap-3 sm:gap-4 lg:mx-0 [animation-delay:300ms]">
            {trustStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/15 bg-white/10 px-3 py-4 text-center shadow-[0_8px_30px_-12px_rgb(2_6_23_/_0.8)] backdrop-blur-md transition-colors duration-300 hover:border-sky-300/40 hover:bg-white/15"
              >
                <dt className="bg-gradient-to-br from-white to-sky-200 bg-clip-text font-display text-2xl font-extrabold text-transparent sm:text-3xl">
                  {stat.value}
                </dt>
                <dd className="mt-1 text-[11px] font-medium leading-tight text-slate-300 sm:text-xs">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Container>
    </section>
  );
}
