import { Container } from '@/components/ui/Container';
import Link from 'next/link';

// You can use actual icons from a library like 'lucide-react'
const Feature = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
    <p className="text-gray-600">{children}</p>
  </div>
);

export default function LandingPage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="bg-gray-50 py-20 md:py-32">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
              Unlock Your Potential with Our Expert-Led Courses
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-600">
              Join a community of learners and gain access to high-quality video content, interactive quizzes, and live sessions with industry professionals.
            </p>
            <div className="mt-8">
              <Link
                href="/auth/register"
                className="inline-block px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Get Started Now
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Features / Announcements Section */}
      <section id="features" className="py-16 md:py-24">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              What We Offer
            </h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Our platform is designed to provide a seamless and engaging learning experience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Feature title="Expert-Led Video Content">
              Learn at your own pace with our extensive library of high-definition video recordings from top instructors.
            </Feature>
            <Feature title="Interactive Quizzes">
              Test your knowledge and solidify your understanding with quizzes for every module. Track your progress easily.
            </Feature>
            <Feature title="Live Zoom Sessions">
              Engage directly with instructors and peers in live Q&A sessions, workshops, and project reviews via Zoom.
            </Feature>
          </div>
        </Container>
      </section>
    </main>
  );
}