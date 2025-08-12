// src/app/page.tsx

import { Container } from '@/components/ui/Container';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight,
  Zap,
  Users,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { FAQSection } from '@/components/layout/FAQSection';

// --- Mock Data ---

const testimonials = [
  { name: 'Sarah L.', role: 'Software Engineer, TechCorp', avatar: '/images/avatars/avatar-1.jpg', quote: "This platform completely changed how I learn. The video quality is superb, and the live sessions are incredibly helpful. I landed my dream job thanks to the skills I gained here!" },
  { name: 'Michael B.', role: 'Product Manager, InnovateCo', avatar: '/images/avatars/avatar-2.jpg', quote: "The course structure is logical and easy to follow. I could immediately apply what I learned to my work. It’s a game-changer for anyone looking to upskill quickly and effectively." },
  { name: 'Alex D.', role: 'Freelance Designer', avatar: '/images/avatars/avatar-6.jpg', quote: "As a freelancer, staying current is crucial. The variety and quality of courses here are unmatched. The community features also provide a great way to network with peers." }
];

// --- Main Landing Page Component ---
export default function LandingPage() {
  return (
    <main className="bg-white font-sans text-slate-800">
      <HeroSection />
     

      <WhyChooseUsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTASection />
    </main>
  );
}


// --- Page Sections (Sub-components) ---

function HeroSection() {
  return (
    <section className="relative h-screen flex items-center justify-center text-white">
      <video
        src="/videos/hero-video.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
        className="absolute top-0 left-0 w-full h-full object-cover z-0 pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/80 via-black/60 to-transparent z-10 pointer-events-none"
      />
      
      <Container className="relative z-20 pt-16 text-center">
        <h1 className="font-display text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
          Your Future, Accelerated.
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-sky-100/90">
          Master in-demand skills with expert-led, hands-on courses.
        </p>
        <div className="mt-10">
          <Link href="/auth/register" className="btn-primary group inline-flex items-center text-lg px-8 py-4 font-semibold">
            Start Learning Now <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </Container>
    </section>
  );
}


// NEW IMAGE-DRIVEN "WHY CHOOSE US" SECTION
function WhyChooseUsSection() {
    const features = [
        { icon: Zap, title: "Learn Faster", image: "/images/feature-accelerated.jpg" },
        { icon: Users, title: "Build Connections", image: "/images/feature-community.jpg" },
        { icon: ShieldCheck, title: "Earn Credentials", image: "/images/feature-certificate.jpg" },
    ];
    return (
        <section className="bg-white py-24 sm:py-32">
            <Container>
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900">The Modern Way to Master a Skill</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((item) => (
                        <div key={item.title} className="relative rounded-xl overflow-hidden h-96 group shadow-lg">
                           <Image src={item.image} alt={item.title} layout="fill" className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                           <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                                <item.icon className="h-10 w-10 mb-2 text-sky-300"/>
                                <h3 className="text-2xl font-bold">{item.title}</h3>
                           </div>
                        </div>
                    ))}
                </div>
            </Container>
        </section>
    );
}

// NEW VISUALLY-DRIVEN "HOW IT WORKS" SECTION
function HowItWorksSection() {
    const steps = [
        {
            title: '1. Find Your Course',
            image: '/images/how-it-works-1.jpg',
            points: ['Browse our expert catalog', 'Filter by skill and level', 'Watch course previews'],
        },
        {
            title: '2. Start Learning',
            image: '/images/how-it-works-2.jpg',
            points: ['Engage with video lessons', 'Complete hands-on projects', 'Join live Q&A sessions'],
        },
        {
            title: '3. Achieve Your Goal',
            image: '/images/how-it-works-3.jpg',
            points: ['Receive your certificate', 'Showcase projects in your portfolio', 'Advance in your career'],
        },
    ];

    return (
        <section className="bg-slate-50 py-24 sm:py-32">
            <Container>
                <div className="text-center mb-20">
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900">Launch Your Learning Journey</h2>
                </div>
                <div className="space-y-24">
                    {steps.map((step, i) => (
                        <div key={step.title} className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                            <div className={`rounded-xl shadow-2xl overflow-hidden ${i % 2 === 0 ? 'lg:order-last' : ''}`}>
                                <Image src={step.image} alt={step.title} width={800} height={600} className="w-full object-cover" />
                            </div>
                            <div className="lg:pr-8">
                                <h3 className="font-display text-3xl font-bold text-slate-800 mb-6">{step.title}</h3>
                                <ul className="space-y-4">
                                    {step.points.map(point => (
                                        <li key={point} className="flex items-center text-lg text-slate-700">
                                            <CheckCircle2 className="h-6 w-6 mr-3 text-sky-500" />
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

function TestimonialsSection() {
  return (
    <section className="bg-white py-24 sm:py-32 relative overflow-hidden">
      <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[150%] h-[150%] bg-gradient-to-br from-sky-50 via-white to-white -z-10 rounded-[100%]"></div>
      <Container>
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900">Success Stories</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {testimonials.map(t => (
            <blockquote key={t.name} className="p-8 bg-white/60 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/80 flex flex-col">
                <p className="flex-grow text-slate-700 text-lg leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-6 flex items-center gap-4 border-t border-slate-200/80 pt-6">
                <Image src={t.avatar} alt={t.name} width={48} height={48} className="rounded-full h-12 w-12 object-cover" />
                <div>
                  <p className="font-semibold text-slate-900">{t.name}</p>
                  <p className="text-slate-600 text-sm">{t.role}</p>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </Container>
    </section>
  )
}

function FinalCTASection() {
  return (
    <section className="bg-slate-900">
        <Container>
            <div className="relative isolate overflow-hidden px-6 py-24 text-center sm:px-16 sm:py-32">
                <div aria-hidden="true" className="absolute -top-24 left-1/2 -z-10 -translate-x-1/2 transform-gpu blur-3xl">
                    <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#0ea5e9] to-[#3b82f6] opacity-30"></div>
                </div>
                <h2 className="font-display mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to Build Your Future?</h2>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-300">Join thousands of successful learners today.</p>
                <div className="mt-10">
                    <Link href="/auth/register" className="btn-primary text-lg px-8 py-4 font-semibold shadow-lg">Sign Up for Free</Link>
                </div>
            </div>
        </Container>
    </section>
  );
}