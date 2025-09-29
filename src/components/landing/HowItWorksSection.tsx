"use client";

import { useTranslations } from 'next-intl';
import { Container } from '@/components/ui/Container';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';

export default function HowItWorksSection() {
  const t = useTranslations('LandingPage.HowItWorks');
  const stepsData = t.raw('steps') as { title: string; description: string; points: string[] }[];
  const images = ['/images/p3.jpg', '/images/p1.jpg', '/images/p4.jpg'];

  return (
    <section className="bg-gradient-to-br from-sky-50 via-white to-blue-100 py-24 sm:py-32">
      <Container>
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-4">{t('title')}</h2>
          <p className="text-xl text-slate-700">{t('subtitle')}</p>
        </div>
        <div className="space-y-24">
          {stepsData.map((step, i) => (
            <div key={i} className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className={`rounded-3xl shadow-2xl overflow-hidden border border-slate-200/60 bg-white/40 backdrop-blur-lg ${i % 2 === 0 ? 'lg:order-last' : ''}`}>
                <Image src={images[i]} alt={step.title} width={900} height={600} className="w-full object-cover transition-transform duration-500 hover:scale-105" />
              </div>
              <div className={`lg:${i % 2 === 0 ? 'pl-8' : 'pr-8'}`}>
                <h3 className="font-display text-4xl font-bold text-slate-800 mb-6 leading-snug">{step.title}</h3>
                <p className="text-xl text-slate-700 mb-8">{step.description}</p>
                <ul className="space-y-4">
                  {step.points.map(point => (
                    <li key={point} className="flex items-start text-lg text-slate-700">
                      <CheckCircle2 className="h-6 w-6 mr-3 text-sky-500 shrink-0 mt-1" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
