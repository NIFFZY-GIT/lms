// src/app/page.tsx

import { Container } from '@/components/ui/Container';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Zap,
  Users,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  MonitorPlay,
  Award,
  Star,
  MessageCircle,
} from 'lucide-react';
import { FAQSection } from '@/components/layout/FAQSection'; // Assuming this component is robust

// --- Mock Data ---
const testimonials = [
  { name: 'Sarah L.', role: 'Software Engineer, TechCorp', avatar: '/images/p5.jpg', quote: "This platform completely changed how I learn. The video quality is superb, and the live sessions are incredibly helpful. I landed my dream job thanks to the skills I gained here!" },
  { name: 'Michael B.', role: 'Product Manager, InnovateCo', avatar: '/images/avatars/avatar-2.jpg', quote: "The course structure is logical and easy to follow. I could immediately apply what I learned to my work. It’s a game-changer for anyone looking to upskill quickly and effectively." },
  { name: 'Alex D.', role: 'Freelance Designer', avatar: '/images/avatars/avatar-6.jpg', quote: "As a freelancer, staying current is crucial. The variety and quality of courses here are unmatched. The community features also provide a great way to network with peers." },
  { name: 'Jessica M.', role: 'Marketing Specialist', avatar: '/images/avatars/avatar-3.jpg', quote: "I appreciate the depth of content and the practical exercises. It's not just theory; it's about real-world application. Highly recommend for career growth!" },
  { name: 'David P.', role: 'Data Scientist', avatar: '/images/avatars/avatar-4.jpg', quote: "The instructors are truly experts in their fields, and the support staff is incredibly responsive. This is the best online learning experience I've had." },
];

const popularCourses = [
  { id: 1, title: 'Advanced React Development', instructor: 'Jane Doe', rating: 4.9, students: '12K+', image: '/images/courses/react-course.jpg' },
  { id: 2, title: 'Machine Learning with Python', instructor: 'John Smith', rating: 4.8, students: '15K+', image: '/images/courses/ml-course.jpg' },
  { id: 3, title: 'UI/UX Design Masterclass', instructor: 'Emily White', rating: 4.7, students: '10K+', image: '/images/courses/uiux-course.jpg' },
];

// --- Main Landing Page Component ---
export default function LandingPage() {
  return (
    <main className="bg-gradient-to-br from-sky-50 via-white to-blue-100 min-h-screen font-sans text-slate-800">
      <HeroSection />
      <FeatureGridSection />
      
      <HowItWorksSection />
      <WhyChooseUsSection /> {/* Reordered */}
     
      <StatsSection /> {/* New section */}
      <FAQSection />
  
    </main>
  );
}

// --- Page Sections (Sub-components) ---

function HeroSection() {
  return (
    <section className="relative h-[91vh] flex items-center justify-center text-white overflow-hidden">
      <video
        src="/videos/v1.mp4" // Ensure you have an engaging video here
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
        className="absolute top-0 left-0 w-full h-full object-cover z-0 pointer-events-none scale-105"
      />
      {/* Overlay to improve text readability */}
      <div
        aria-hidden
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/80 via-blue-700/60 to-transparent z-10 pointer-events-none"
      />
      {/* Optional: Backdrop blur for a frosted glass effect over the video */}
      {/* <div className="absolute top-0 left-0 w-full h-full backdrop-blur-sm z-10" /> */}

      <Container className="relative z-20 pt-16 text-center animate-fade-in">
        <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-lg mb-6 leading-tight">
          Unlock Your Potential, <br className="hidden sm:inline" />Accelerate Your Career.
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-xl text-sky-100/90 font-medium drop-shadow">
          Master in-demand skills with expert-led courses, hands-on projects, and a vibrant global community.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 text-lg font-bold text-white shadow-xl hover:scale-105 hover:from-blue-700 transition-transform duration-200 group">
            Start Learning Now <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/courses" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-white text-lg font-bold text-white shadow-xl hover:scale-105 hover:bg-white/20 transition-transform duration-200">
            Browse Courses
          </Link>
        </div>
      </Container>
    </section>
  );
}

// NEW: Feature Grid Section - concise benefits
function FeatureGridSection() {
  const features = [
    { icon: BookOpen, title: 'Comprehensive Curriculum', description: 'Access a vast library of courses covering the latest technologies and skills.' },
    { icon: MonitorPlay, title: 'Interactive Video Lessons', description: 'Learn at your own pace with high-quality, engaging video content and practical exercises.' },
    { icon: Users, title: 'Supportive Community', description: 'Connect with peers and instructors in live sessions and dedicated forums.' },
    { icon: Award, title: 'Industry-Recognized Certificates', description: 'Earn credentials to showcase your expertise and boost your career prospects.' },
  ];

  return (
    <section className="py-24 sm:py-32 bg-sky-50/70 backdrop-blur-lg">
      <Container>
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Choose Our Platform?</h2>
          <p className="text-xl text-slate-700">Experience a learning environment designed for real-world impact and career transformation.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center p-8 bg-white/60 rounded-xl shadow-lg border border-slate-200/80 hover:shadow-xl transition-shadow duration-300">
              <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-700">{feature.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

// NEW: Popular Courses Section
function PopularCoursesSection() {
  return (
    <section className="bg-gradient-to-br from-white to-blue-50 py-24 sm:py-32">
      <Container>
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-4">Our Most Popular Courses</h2>
          <p className="text-xl text-slate-700 max-w-2xl mx-auto">Discover what other learners are mastering to stay ahead in their careers.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {popularCourses.map(course => (
            <Link href={`/courses/${course.id}`} key={course.id} className="block group rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-200/80 bg-white/70 backdrop-blur-lg">
              <div className="relative h-60 w-full overflow-hidden">
                <Image src={course.image} alt={course.title} layout="fill" objectFit="cover" className="transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-300 mb-2">{course.title}</h3>
                <p className="text-slate-600 text-sm">Instructor: {course.instructor}</p>
                <div className="flex items-center mt-3 text-slate-700">
                  <Star className="h-5 w-5 fill-yellow-400 stroke-yellow-400 mr-1" />
                  <span>{course.rating} ({course.students})</span>
                </div>
                <button className="mt-5 inline-flex items-center gap-2 text-blue-600 font-semibold group-hover:translate-x-1 transition-transform duration-200">
                  View Course <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-16">
          <Link href="/courses" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 text-lg font-bold text-white shadow-lg hover:scale-105 hover:bg-blue-700 transition-transform duration-200">
            Explore All Courses <ArrowRight className="ml-2 h-6 w-6" />
          </Link>
        </div>
      </Container>
    </section>
  );
}


// REFINED VISUALLY-DRIVEN "HOW IT WORKS" SECTION
function HowItWorksSection() {
    const steps = [
        {
            title: '1. Discover Your Path',
            image: '/images/p3.jpg',
            description: 'Explore our diverse catalog of expert-led courses. Find the perfect program to match your career goals and skill level.',
            points: ['Browse expert-curated courses', 'Filter by skill, level, and career path', 'Watch free course previews'],
        },
        {
            title: '2. Engage & Learn',
            image: '/images/p1.jpg',
            description: 'Dive into interactive video lessons, hands-on projects, and coding challenges. Participate in live Q&A with instructors and peers.',
            points: ['Immersive video lessons & exercises', 'Build real-world projects', 'Connect in live sessions'],
        },
        {
            title: '3. Achieve & Advance',
            image: '/images/p4.jpg',
            description: 'Earn industry-recognized certificates, build a strong portfolio, and connect with potential employers. Propel your career forward with confidence.',
            points: ['Receive your official certificate', 'Showcase projects to employers', 'Land your dream job'],
        },
    ];

    return (
  <section className="bg-gradient-to-br from-sky-50 via-white to-blue-100 py-24 sm:py-32">
            <Container>
                <div className="text-center mb-20 max-w-3xl mx-auto">
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-4">Your Journey to Expertise</h2>
                    <p className="text-xl text-slate-700">Follow these simple steps to transform your skills and career.</p>
                </div>
                <div className="space-y-24">
                    {steps.map((step, i) => (
            <div key={step.title} className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className={`rounded-3xl shadow-2xl overflow-hidden border border-slate-200/60 bg-white/40 backdrop-blur-lg ${i % 2 === 0 ? 'lg:order-last' : ''}`}>
                <Image src={step.image} alt={step.title} width={900} height={600} className="w-full object-cover transition-transform duration-500 hover:scale-105" />
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

// Renamed "WhyChooseUsSection" to "ImpactSection" and made it more dynamic
function WhyChooseUsSection() {
    const impacts = [
        { icon: Zap, title: "Accelerated Learning", description: "Get job-ready faster with condensed, high-impact lessons designed for efficiency." },
        { icon: Users, title: "Global Community", description: "Join a thriving network of learners and experts for collaborative growth and support." },
        { icon: ShieldCheck, title: "Verified Credentials", description: "Boost your resume with certificates respected by leading companies worldwide." },
    ];
    return (
  <section className="bg-white/80 backdrop-blur-lg py-24 sm:py-32">
            <Container>
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-4">Real Impact, Real Results</h2>
                    <p className="text-xl text-slate-700">Our commitment to your success is built on these core pillars.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {impacts.map((item) => (
                <div key={item.title} className="relative rounded-3xl overflow-hidden h-[400px] group shadow-2xl border border-slate-200/60 hover:scale-105 transition-transform duration-300 bg-white/30 backdrop-blur-lg">
                  {/* Assuming these images exist and are engaging */}
                  <Image src={`/images/impact-${item.title.toLowerCase().replace(/\s/g, '-')}.jpg`} alt={item.title} layout="fill" className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/70 to-transparent"></div>
                  <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                      <item.icon className="h-12 w-12 mb-3 text-sky-300 drop-shadow-lg"/>
                      <h3 className="text-3xl font-bold drop-shadow-lg mb-2">{item.title}</h3>
                      <p className="text-sky-100/90 text-lg">{item.description}</p>
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
    <section className="bg-gradient-to-br from-blue-50 via-white to-white py-24 sm:py-32 relative overflow-hidden">
      <Container>
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-4">What Our Learners Say</h2>
          <p className="text-xl text-slate-700">Hear directly from individuals who transformed their careers with us.</p>
        </div>
        {/* Dynamic grid for testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <blockquote key={t.name} className="p-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-200/80 flex flex-col hover:shadow-2xl transition-all duration-300">
                <p className="flex-grow text-slate-700 text-lg leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-auto flex items-center gap-4 border-t border-slate-200/80 pt-6">
                <Image src={t.avatar} alt={t.name} width={56} height={56} className="rounded-full h-14 w-14 object-cover shadow-md" />
                <div>
                  <p className="font-semibold text-slate-900 text-lg">{t.name}</p>
                  <p className="text-slate-600 text-base">{t.role}</p>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
        <div className="text-center mt-16">
          <Link href="/testimonials" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-blue-600 text-lg font-bold text-blue-600 shadow-lg hover:scale-105 hover:bg-blue-50 transition-transform duration-200">
            Read More Stories <ArrowRight className="ml-2 h-6 w-6" />
          </Link>
        </div>
      </Container>
    </section>
  )
}

// NEW: Stats Section for social proof
function StatsSection() {
  const stats = [
    { value: '250K+', label: 'Learners Worldwide' },
    { value: '500+', label: 'Expert-Led Courses' },
    { value: '4.9/5', label: 'Average Course Rating' },
    { value: '92%', label: 'Career Advancement Rate' },
  ];

  return (
    <section className="bg-gradient-to-br from-blue-800 to-blue-950 py-24 sm:py-32 text-white">
      <Container>
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">Numbers Speak for Themselves</h2>
          <p className="text-xl text-sky-100/90">Join a thriving community and achieve your career aspirations.</p>
        </div>
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="font-display text-6xl font-extrabold text-sky-300 drop-shadow-lg">{stat.value}</p>
              <p className="mt-4 text-xl font-medium text-sky-100">{stat.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}



// Ensure you have these placeholder images for testing:
// /public/images/avatars/avatar-1.jpg
// /public/images/avatars/avatar-2.jpg
// /public/images/avatars/avatar-3.jpg
// /public/images/avatars/avatar-4.jpg
// /public/images/avatars/avatar-6.jpg
// /public/images/courses/react-course.jpg (e.g., a laptop with React code)
// /public/images/courses/ml-course.jpg (e.g., data visualization, AI concepts)
// /public/images/courses/uiux-course.jpg (e.g., a person designing on a tablet)
// /public/images/how-it-works-1.jpg (e.g., someone browsing courses on a tablet)
// /public/images/how-it-works-2.jpg (e.g., someone engaged in a video lesson or coding)
// /public/images/how-it-works-3.jpg (e.g., a certificate being held, someone in a professional setting)
// /public/images/impact-accelerated-learning.jpg (e.g., someone quickly typing, a brain graphic)
// /public/images/impact-global-community.jpg (e.g., diverse people collaborating online)
// /public/images/impact-verified-credentials.jpg (e.g., a professional looking at a certificate)
// /public/videos/hero-video.mp4 (e.g., montage of people learning, coding, collaborating, achieving goals)