"use client";

import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Container';
import Image from 'next/image';
import { Check } from 'lucide-react';

// Both locales prefix step titles with "1. ", "2. ", … — the number is rendered
// as a badge instead, so strip it from the heading text.
const stripStepNumber = (title: string) => title.replace(/^\s*\d+\s*[.)]\s*/, '');

export default function HowItWorksSection() {
  const t = useTranslations('LandingPage.HowItWorks');
  const stepsData = t.raw('steps') as { title: string; description: string; points: string[] }[];
  const images = ['/images/p3.jpg', '/images/p1.jpg', '/images/p4.jpg'];

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 py-20 sm:py-28">
      <div aria-hidden className="landing-orb right-[-15%] top-1/4 h-[28rem] w-[28rem] bg-indigo-200/40" />

      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="landing-heading font-display">{t('title')}</h2>
          <p className="landing-sub mt-5">{t('subtitle')}</p>
        </div>

        <div className="mt-16 space-y-16 sm:mt-20 sm:space-y-28">
          {stepsData.map((step, i) => {
            const imageFirst = i % 2 === 1;
            return (
              <div key={step.title} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                {/* Framed image with a soft brand glow behind it */}
                <div className={`relative ${imageFirst ? 'lg:order-first' : 'lg:order-last'}`}>
                  <div
                    aria-hidden
                    className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-tr from-blue-500/25 via-cyan-400/20 to-transparent blur-2xl"
                  />
                  <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-slate-200 shadow-[0_30px_60px_-25px_rgb(15_23_42_/_0.5)] ring-1 ring-white/60">
                    <Image
                      src={images[i]}
                      alt={stripStepNumber(step.title)}
                      fill
                      sizes="(min-width: 1024px) 46vw, 100vw"
                      className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
                    />
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent"
                    />
                    {/* Step number, floating over the image corner */}
                    <span className="absolute bottom-5 left-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 font-display text-xl font-extrabold text-white shadow-lg shadow-blue-900/40 ring-4 ring-white/25">
                      {i + 1}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-display text-2xl font-bold leading-snug tracking-tight text-slate-900 sm:text-3xl">
                    {stripStepNumber(step.title)}
                  </h3>
                  <p className="landing-sub mt-4">{step.description}</p>

                  <ul className="mt-7 space-y-3">
                    {step.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-3 rounded-xl bg-white/70 px-4 py-3 text-[15px] leading-relaxed text-slate-700 shadow-sm ring-1 ring-slate-200/70 backdrop-blur-sm transition-colors duration-200 hover:ring-blue-200"
                      >
                        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
