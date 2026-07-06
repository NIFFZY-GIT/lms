"use client";

import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Container';
import { BookMarked, FileText, GraduationCap, MessagesSquare } from 'lucide-react';

export default function StudyPathsSection() {
  const t = useTranslations('LandingPage.StudyPaths');
  const paths = t.raw('paths') as { title: string; description: string; bullets: string[] }[];
  const icons = [BookMarked, FileText, GraduationCap, MessagesSquare];

  return (
    <section className="bg-white py-24 sm:py-32">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">{t('eyebrow')}</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-5 text-xl leading-8 text-slate-700">
            {t('subtitle')}
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {paths.map((path, index) => {
            const Icon = icons[index];
            return (
              <article
                key={path.title}
                className="rounded-3xl border border-slate-200 bg-slate-50/80 p-8 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-slate-900">{path.title}</h3>
                <p className="mt-4 text-base leading-7 text-slate-700">{path.description}</p>
                <ul className="mt-6 space-y-3 text-sm leading-6 text-slate-700">
                  {path.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
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
