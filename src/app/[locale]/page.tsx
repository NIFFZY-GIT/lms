import HeroSection from '@/components/landing/HeroSection';
import FeatureGridSection from '@/components/landing/FeatureGridSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import StatsSection from '@/components/landing/StatsSection';
// import { FAQSection } from '@/components/layout/FAQSection';

export default function LandingPage() {
  return (
    <main className="bg-gradient-to-br from-sky-50 via-white to-blue-100 min-h-screen font-sans text-slate-800">
      <HeroSection />
      <FeatureGridSection />
      <HowItWorksSection />
      <StatsSection />
      {/* <FAQSection /> */}
    </main>
  );
}

