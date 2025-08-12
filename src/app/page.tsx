// src/app/page.tsx

import { Container } from '@/components/ui/Container';
import Link from 'next/link';
import Image from 'next/image';
import { 
  PlayCircle, 
  Search,
  Laptop,
  Trophy
} from 'lucide-react';
import { FAQSection } from '@/components/layout/FAQSection';

// (Removed unused featuredCourses placeholder to satisfy ESLint)

const testimonials = [
  { name: 'Sarah L.', role: 'Software Engineer', avatar: '/images/avatars/avatar-1.jpg', quote: "This platform completely changed how I learn. The video quality is superb, and the live sessions are incredibly helpful. I landed a new job thanks to the skills I gained here!" },
  { name: 'Michael B.', role: 'Product Manager', avatar: '/images/avatars/avatar-2.jpg', quote: "The course structure is logical and easy to follow. I could immediately apply what I learned to my work. Highly recommended for anyone looking to upskill." }
];

// --- Main Landing Page Component ---
export default function LandingPage() {
  return (
    <main className="bg-white">
      <HeroSection />
      <LogoCloud />
      <FeaturesSection />
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
      <video src="/videos/hero-video.mp4" autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover z-0" />
      <div className="absolute top-0 left-0 w-full h-full bg-black/60 z-10"></div>
      <Container className="relative z-20 pt-16 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-7xl">
          Transform Your Future with <span className="text-blue-300">Expert-Led Learning</span>
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg text-blue-100/90 md:text-xl">
          Join a community of ambitious learners. Gain in-demand skills through high-quality video courses, interactive projects, and direct access to industry experts.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/auth/register" className="btn-primary text-lg px-8 py-4">Start Learning for Free</Link>
          <Link href="/courses" className="inline-flex items-center justify-center rounded-md text-lg font-medium text-white bg-white/10 px-8 py-4 backdrop-blur-sm transition-colors hover:bg-white/20">
            <PlayCircle className="mr-2 h-6 w-6" /> Explore Courses
          </Link>
        </div>
      </Container>
    </section>
  );
}

function LogoCloud() {
  const logos = ['logo-1.svg', 'logo-2.svg', 'logo-3.svg', 'logo-4.svg', 'logo-5.svg'];
  return (
    <div className="bg-white py-8 sm:py-12">
      <Container>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-center text-lg font-semibold leading-8 text-gray-900">Trusted by the most innovative teams</h2>
          <div className="mx-auto mt-10 grid max-w-lg grid-cols-2 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:grid-cols-3 sm:gap-x-10 lg:mx-0 lg:max-w-none lg:grid-cols-5">
            {logos.map(logo => <Image key={logo} className="col-span-1 max-h-12 w-full object-contain" src={`/logos/${logo}`} alt="Partner Logo" width={158} height={48} />)}
          </div>
        </div>
      </Container>
    </div>
  )
}

// === NEW IMAGE-RICH FEATURES SECTION ===
function FeaturesSection() {
    const features = [
        { 
            title: 'On-Demand Video Lectures',
            description: 'Learn at your own pace with our extensive library of high-definition video recordings from industry experts.',
            image: '/images/feature-videos.jpg'
        },
        { 
            title: 'Interactive Community',
            description: 'Engage directly with instructors and peers in live Q&A sessions, dedicated forums, and project-based groups.',
            image: '/images/feature-community.jpg'
        },
        { 
            title: 'Verifiable Certificates',
            description: 'Receive a professional certificate upon course completion to validate your skills and boost your LinkedIn profile.',
            image: '/images/feature-certificate.jpg'
        },
    ];
    return (
        <section className="bg-gray-50 py-24 sm:py-32">
            <Container>
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">A Better Way to Learn</h2>
                    <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Our platform provides everything you need to master new skills.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature) => (
                        <div key={feature.title} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
                           <Image src={feature.image} alt={feature.title} width={500} height={350} className="w-full h-56 object-cover"/>
                           <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                           </div>
                        </div>
                    ))}
                </div>
            </Container>
        </section>
    );
}

// === NEW "HOW IT WORKS" SECTION ===
function HowItWorksSection() {
    const steps = [
        {
            icon: Search,
            title: '1. Discover Your Course',
            description: 'Browse our extensive catalog of courses to find the perfect one to match your career goals.',
            image: '/images/how-it-works-1.jpg'
        },
        {
            icon: Laptop,
            title: '2. Learn and Practice',
            description: 'Watch engaging video lectures, complete interactive quizzes, and build real-world projects.',
            image: '/images/how-it-works-2.jpg'
        },
        {
            icon: Trophy,
            title: '3. Achieve Your Goals',
            description: 'Get certified, build a portfolio, and advance your career with your newfound skills.',
            image: '/images/how-it-works-3.jpg'
        },
    ];
    return (
        <section className="bg-white py-24 sm:py-32">
            <Container>
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Start Learning in 3 Easy Steps</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-16">
                    {steps.map((step) => (
                        <div key={step.title} className="flex flex-col items-center text-center">
                            <div className="mb-6">
                                <Image src={step.image} alt={step.title} width={400} height={400} className="rounded-full h-64 w-64 object-cover shadow-xl"/>
                            </div>
                            <div className="mb-4 bg-blue-600 text-white rounded-full h-12 w-12 flex items-center justify-center">
                                <step.icon className="h-6 w-6"/>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{step.title}</h3>
                            <p className="text-gray-600 max-w-xs">{step.description}</p>
                        </div>
                    ))}
                </div>
            </Container>
        </section>
    );
}




function TestimonialsSection() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <Container>
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">What Our Students Say</h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Success stories from our growing community of learners.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {testimonials.map(t => (
            <blockquote key={t.name} className="p-8 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-700 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-6 flex items-center gap-4">
                <Image src={t.avatar} alt={t.name} width={48} height={48} className="rounded-full h-12 w-12 object-cover" />
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-gray-600 text-sm">{t.role}</p>
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
  <section className="bg-blue-700">
      <Container>
        <div className="relative isolate overflow-hidden px-6 py-24 text-center sm:px-16 sm:py-32">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to Start Your Learning Journey?</h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">Create an account today and get instant access to our free introductory courses.</p>
          <div className="mt-10">
            <Link href="/auth/register" className="rounded-md bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Sign Up Now</Link>
          </div>
          {/* Background accent removed to avoid gradients */}
        </div>
      </Container>
    </section>
  );
}