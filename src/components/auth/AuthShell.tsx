'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import type { LucideIcon } from 'lucide-react';
import { VideoBackdrop } from '@/components/ui/VideoBackdrop';

/**
 * Shared chrome for the sign-in / sign-up screens: the brand panel on the left
 * and the form column on the right, on the same dark gradient the landing hero
 * and closing band use.
 */
export function AuthShell({
  headline,
  accent,
  blurb,
  features,
  children,
}: {
  headline: string;
  accent: string;
  blurb: string;
  features: { icon: LucideIcon; text: string }[];
  children: React.ReactNode;
}) {
  const locale = useLocale();
  const stats = useTranslations('LandingPage.Stats');
  // Reuse the landing figures so the two screens can never quote different numbers.
  const trustStats = (stats.raw('stats') as { value: string; label: string }[]).slice(0, 3);

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-slate-950 lg:flex-row">
      {/* Same backdrop as the landing hero: still paints first, video fades in over it */}
      <Image
        src="/images/p6.jpg"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-30 object-cover"
      />
      <VideoBackdrop src="/images/v1.mp4" className="absolute inset-0 -z-30 h-full w-full" />

      {/* Scrim. Heavier than the hero's: a form has to stay readable over moving
          video, and content sits on both edges here rather than just the left. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-gradient-to-br from-slate-950/95 via-blue-950/90 to-indigo-950/95"
      />
      <div aria-hidden className="absolute inset-0 -z-20 bg-slate-950/40" />

      {/* Decorative layers, matched to the landing page */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[url('/patterns/grid.svg')] bg-center opacity-25 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]"
      />
      <div aria-hidden className="landing-orb -left-32 -top-24 h-[32rem] w-[32rem] bg-blue-600/30" />
      <div aria-hidden className="landing-orb -bottom-32 -right-24 h-[30rem] w-[30rem] bg-cyan-400/20" />

      {/* --- Brand panel --- */}
      <div className="hidden flex-col justify-between p-12 lg:flex lg:w-[45%] xl:p-16">
        <AuthLogo locale={locale} />

        <div className="max-w-lg">
          <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-white text-balance xl:text-5xl">
            {headline}{' '}
            <span className="bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text text-transparent">{accent}</span>
          </h1>
          <p className="mt-6 text-base leading-relaxed text-slate-300 text-pretty">{blurb}</p>

          <ul className="mt-10 space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3.5 text-slate-200">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-sky-300 backdrop-blur-sm">
                  <Icon size={18} />
                </span>
                <span className="text-[15px] font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <dl className="grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
          {trustStats.map((stat) => (
            <div key={stat.label}>
              <dt className="font-display text-2xl font-bold text-white">{stat.value}</dt>
              <dd className="mt-1 text-xs font-medium text-slate-400">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* --- Form column --- */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8 lg:py-12">
        <div className="mb-8 lg:hidden">
          <AuthLogo locale={locale} />
        </div>

        {children}

        <p className="mt-8 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} onlinethakshilawa.lk — All rights reserved
        </p>
      </div>
    </div>
  );
}

/**
 * The brand mark is a dark navy/teal wordmark with no light variant, so on this
 * dark panel it sits on a white chip rather than being inverted (inverting would
 * destroy its green-to-teal gradient).
 */
function AuthLogo({ locale }: { locale: string }) {
  return (
    <Link
      href={`/${locale}`}
      className="inline-flex rounded-2xl bg-white px-4 py-3 shadow-lg shadow-slate-950/30 transition-transform duration-200 hover:scale-[1.02]"
    >
      <Image
        src="/logo.png"
        alt="Online Thakshilawa"
        width={1485}
        height={611}
        sizes="200px"
        priority
        className="h-9 w-auto"
      />
    </Link>
  );
}
