"use client";

import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Container';
import { BookMarked, FileText, GraduationCap, MessagesSquare } from 'lucide-react';

// A fixed hue per card slot — assigned in order, never cycled.
const ACCENTS = [
  { tile: 'from-blue-500 to-indigo-600', dot: 'bg-blue-500', glow: 'shadow-blue-500/30' },
  { tile: 'from-cyan-500 to-blue-500', dot: 'bg-cyan-500', glow: 'shadow-cyan-500/30' },
  { tile: 'from-violet-500 to-purple-600', dot: 'bg-violet-500', glow: 'shadow-violet-500/30' },
  { tile: 'from-amber-500 to-orange-500', dot: 'bg-amber-500', glow: 'shadow-amber-500/30' },
];

export default function StudyPathsSection() {
  const t = useTranslations('LandingPage.StudyPaths');
  const paths = t.raw('paths') as { title: string; description: string; bullets: string[] }[];
  const icons = [BookMarked, FileText, GraduationCap, MessagesSquare];

  return (
    <section className="relative isolate overflow-hidden bg-white py-20 sm:py-28">
      <div aria-hidden className="landing-orb -left-32 bottom-10 h-96 w-96 bg-violet-200/40" />

      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <p className="landing-eyebrow">{t('eyebrow')}</p>
          <h2 className="landing-heading font-display mt-4">{t('title')}</h2>
          <p className="landing-sub mt-5">{t('subtitle')}</p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          {paths.map((path, index) => {
            const Icon = icons[index];
            const accent = ACCENTS[index % ACCENTS.length];
            return (
              <article key={path.title} className="landing-card group p-8">
                <div className="flex items-start gap-5">
                  <span
                    className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent.tile} text-white shadow-lg ${accent.glow} transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110`}
                  >
                    <Icon className="h-7 w-7" />
                  </span>
                  <div>
                    <h3 className="text-xl font-bold leading-snug text-slate-900">{path.title}</h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{path.description}</p>
                  </div>
                </div>

                <ul className="mt-7 space-y-3 border-t border-slate-100 pt-6">
                  {path.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-[15px] leading-relaxed text-slate-700">
                      <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${accent.dot}`} />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
