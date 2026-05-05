import HeroSection         from "@/components/marketing/HeroSection";
import MarqueeStrip        from "@/components/marketing/MarqueeStrip";
import FeaturesSection     from "@/components/marketing/FeaturesSection";
import HowItWorksSection   from "@/components/marketing/HowItWorksSection";
import StatsBar            from "@/components/marketing/StatsBar";
import TestimonialsSection from "@/components/marketing/TestimonialsSection";
import InterviewTypesSection from "@/components/marketing/InterviewTypesSection";
import ComparisonTable     from "@/components/marketing/ComparisonTable";
import FAQSection          from "@/components/marketing/FAQSection";
import CTABanner           from "@/components/marketing/CTABanner";

export const metadata = {
  title: "Askaisl — AI Consumer Research Interviews",
  description: "AI-powered consumer research interviews for FMCG brands in Sri Lanka. Adaptive, trilingual, available 24/7.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <MarqueeStrip />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsBar />
      <TestimonialsSection />
      <InterviewTypesSection />
      <ComparisonTable />
      <FAQSection />
      <CTABanner />
    </>
  );
}
