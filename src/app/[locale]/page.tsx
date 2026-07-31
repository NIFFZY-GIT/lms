import HeroSection from '@/components/landing/HeroSection';
import FeatureGridSection from '@/components/landing/FeatureGridSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import StatsSection from '@/components/landing/StatsSection';
import StudyPathsSection from '@/components/landing/StudyPathsSection';
// import { FAQSection } from '@/components/layout/FAQSection';

export default function LandingPage() {
  // Sections alternate white / slate-50 and close on the dark band, so the page
  // has one consistent rhythm instead of each section carrying its own gradient.
  return (
    <main className="bg-white font-sans text-slate-800">
      <HeroSection />
      <FeatureGridSection />
      <HowItWorksSection />
      <StudyPathsSection />
      <StatsSection />
      {/* <FAQSection /> */}
    </main>
  );
}
