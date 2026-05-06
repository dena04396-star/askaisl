import type { Metadata } from "next";
import HeroSection           from "@/components/marketing/HeroSection";
import MarqueeStrip          from "@/components/marketing/MarqueeStrip";
import FeaturesSection       from "@/components/marketing/FeaturesSection";
import HowItWorksSection     from "@/components/marketing/HowItWorksSection";
import StatsBar              from "@/components/marketing/StatsBar";
import TestimonialsSection   from "@/components/marketing/TestimonialsSection";
import InterviewTypesSection from "@/components/marketing/InterviewTypesSection";
import ComparisonTable       from "@/components/marketing/ComparisonTable";
import FAQSection            from "@/components/marketing/FAQSection";
import CTABanner             from "@/components/marketing/CTABanner";

const BASE = "https://www.askaisl.com";

export const metadata: Metadata = {
  title: "askaisl — AI Consumer Research Interviews",
  description:
    "AI-powered consumer research interviews in English, Sinhala and Tamil for FMCG brands in Sri Lanka. Adaptive, insightful, available 24/7 — no recruiter needed.",
  alternates: { canonical: BASE },
  openGraph: {
    url: BASE,
    title: "askaisl — AI Consumer Research Interviews",
    description:
      "AI-powered consumer research interviews in English, Sinhala and Tamil for FMCG brands in Sri Lanka.",
  },
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "askaisl",
  url: BASE,
  logo: `${BASE}/logo.png`,
  description:
    "AI-powered consumer research interview platform for FMCG brands in Sri Lanka, supporting English, Sinhala and Tamil.",
  sameAs: [],
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "askaisl",
  url: BASE,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Conduct AI-powered consumer research interviews in English, Sinhala and Tamil. Instant qualitative insights for FMCG brands across Sri Lanka.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free tier available",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is askaisl?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "askaisl is an AI-powered consumer research interview platform for FMCG brands in Sri Lanka. It conducts adaptive interviews in English, Sinhala and Tamil, available 24/7 without the need for a human recruiter.",
      },
    },
    {
      "@type": "Question",
      name: "What languages does askaisl support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "askaisl supports English, Sinhala (සිංහල) and Tamil (தமிழ்), making it ideal for reaching respondents across all regions of Sri Lanka.",
      },
    },
    {
      "@type": "Question",
      name: "How does the AI interviewer work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The AI interviewer adapts its questions based on respondent answers, probes deeper when needed, and follows your custom discussion guide — just like a trained human moderator, but available at any time.",
      },
    },
    {
      "@type": "Question",
      name: "What types of research studies can I run?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "askaisl supports Behavioral studies, Decision Journey mapping, Pain Points research, Brand Perception studies and Concept Testing.",
      },
    },
    {
      "@type": "Question",
      name: "How do I share the interview with respondents?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "After creating a session, you get a unique shareable link. Send it to your respondents — they open it in any browser and start the interview immediately with no app download required.",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
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
