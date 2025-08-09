// src/app/[lang]/page.tsx

import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { BookOpen, Target, Users } from 'lucide-react';
import { getDictionary } from '@/lib/dictionary';

const Feature = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 transform hover:-translate-y-1 transition-transform duration-300">
    <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
    <p className="text-gray-600">{children}</p>
  </div>
);

export default async function LandingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <main className="bg-gray-50">
      {/* Hero Section with Video Background */}
      <section className="relative h-screen flex items-center justify-center text-white">
        <video
          src="/videos/hero-video.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
        />
        <div className="absolute top-0 left-0 w-full h-full bg-black opacity-50 z-10"></div>
        
        {/*
          FIX: Added 'pt-16' to this container.
          Since the navbar is sticky and has a height of h-16 (4rem),
          this padding pushes the hero content down so it's not obscured.
        */}
        <Container className="relative z-20 pt-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-md">
              {dict.hero.title}
            </h1>
            <p className="mt-6 text-lg md:text-xl opacity-90">
              {dict.hero.description}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={`/courses`}
                className="inline-block w-full sm:w-auto text-center px-8 py-4 text-lg font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105"
              >
                {dict.hero.cta}
              </Link>
              {/* This is the language switcher button */}
              <LanguageSwitcher variant="button" buttonText={dict.language.changeTo} />
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              {dict.features.title}
            </h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              {dict.features.description}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Feature title={dict.features.videoContent}>
              {dict.features.videoDescription}
            </Feature>
            <Feature title={dict.features.quizzes}>
              {dict.features.quizzesDescription}
            </Feature>
            <Feature title={dict.features.liveSessions}>
              {dict.features.liveSessionsDescription}
            </Feature>
          </div>
        </Container>
      </section>

      {/* About the Institute Section */}
      <section id="about" className="py-16 md:py-24 bg-gray-50">
          <Container>
              <div className="grid md:grid-cols-2 gap-12 items-center">
                  {/* Image Gallery */}
                  <div className="grid grid-cols-2 gap-4">
                      <Image src="/images/institute-1.jpg" alt="Teacher with students" width={400} height={500} className="rounded-lg shadow-xl object-cover w-full h-full col-span-2 row-span-1"/>
                      <Image src="/images/institute-2.jpg" alt="Modern classroom" width={400} height={300} className="rounded-lg shadow-xl object-cover w-full h-full"/>
                      <Image src="/images/institute-3.jpg" alt="Student studying" width={400} height={300} className="rounded-lg shadow-xl object-cover w-full h-full"/>
                  </div>

                  {/* Text Content */}
                  <div>
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{dict.about.title}</h2>
                      <p className="text-gray-600 mb-8">{dict.about.description}</p>
                      <ul className="space-y-6">
                          <li className="flex items-start">
                              <div className="flex-shrink-0 bg-indigo-100 text-indigo-600 rounded-full p-3">
                                  <BookOpen className="w-6 h-6"/>
                              </div>
                              <div className="ml-4">
                                  <h4 className="text-lg font-semibold text-gray-800">{dict.about.point1}</h4>
                              </div>
                          </li>
                          <li className="flex items-start">
                              <div className="flex-shrink-0 bg-indigo-100 text-indigo-600 rounded-full p-3">
                                  <Target className="w-6 h-6"/>
                              </div>
                              <div className="ml-4">
                                  <h4 className="text-lg font-semibold text-gray-800">{dict.about.point2}</h4>
                              </div>
                          </li>
                          <li className="flex items-start">
                              <div className="flex-shrink-0 bg-indigo-100 text-indigo-600 rounded-full p-3">
                                  <Users className="w-6 h-6"/>
                              </div>
                              <div className="ml-4">
                                  <h4 className="text-lg font-semibold text-gray-800">{dict.about.point3}</h4>
                              </div>
                          </li>
                      </ul>
                  </div>
              </div>
          </Container>
      </section>
    </main>
  );
}