"use client";

import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Container';
import { BookOpen, MonitorPlay, Users, Award } from 'lucide-react';

export default function FeatureGridSection() {
  const t = useTranslations('LandingPage.FeatureGrid');
  const featuresData = t.raw('features') as { title: string; description: string }[];
  const icons = [BookOpen, MonitorPlay, Users, Award];

  return (
    <section className="py-24 sm:py-32 bg-sky-50/70 backdrop-blur-lg">
      <Container>
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t('title')}</h2>
          <p className="text-xl text-slate-700">{t('subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuresData.map((feature, index) => {
            const Icon = icons[index];
            return (
              <div key={index} className="flex flex-col items-center text-center p-8 bg-white/60 rounded-xl shadow-lg border border-slate-200/80 hover:shadow-xl transition-shadow duration-300">
                <Icon className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-700">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
