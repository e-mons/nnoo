import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import HeroSection from "@/components/marketing/HeroSection";
import IntelligenceGapSection from "@/components/marketing/IntelligenceGapSection";
import ProcessSection from "@/components/marketing/ProcessSection";
import FeatureGrid from "@/components/marketing/FeatureGrid";
import ProductShowcase from "@/components/marketing/ProductShowcase";
import EverydayBusinessSection from "@/components/marketing/EverydayBusinessSection";
import IndustrySection from "@/components/marketing/IndustrySection";
import IntelligenceJourney from "@/components/marketing/IntelligenceJourney";
import BusinessHealthSection from "@/components/marketing/BusinessHealthSection";
import WhyNnooSection from "@/components/marketing/WhyNnooSection";
import BuiltForAfricaSection from "@/components/marketing/BuiltForAfricaSection";
import KnowledgeSection from "@/components/marketing/KnowledgeSection";
import FaqSection from "@/components/marketing/FaqSection";
import ContactSection from "@/components/marketing/ContactSection";
import FinalCtaSection from "@/components/marketing/FinalCtaSection";
import ClosingStatement from "@/components/marketing/ClosingStatement";

export const metadata: Metadata = {
  title: "NNOO — Africa's AI Business Operating System",
  description: "NNOO helps African businesses understand sales, expenses, stock, customers and business performance through one intelligent business system.",
  openGraph: {
    title: "NNOO — Africa's AI Business Operating System",
    description: "NNOO helps African businesses understand sales, expenses, stock, customers and business performance through one intelligent business system.",
    type: "website",
    locale: "en_NG", // Targeting Africa, starting with Nigeria or generic English
  },
};

export default async function MarketingHomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const isLoggedIn = !!data?.user;

  return (
    <>
      <HeroSection isLoggedIn={isLoggedIn} />
      <IntelligenceGapSection />
      <ProcessSection />
      <FeatureGrid isLoggedIn={isLoggedIn} />
      <ProductShowcase isLoggedIn={isLoggedIn} />
      <EverydayBusinessSection />
      <IndustrySection />
      <IntelligenceJourney />
      <BusinessHealthSection />
      <WhyNnooSection />
      <BuiltForAfricaSection />
      <KnowledgeSection isLoggedIn={isLoggedIn} />
      <FaqSection />
      <ContactSection id="contact" />
      <FinalCtaSection isLoggedIn={isLoggedIn} />
      <ClosingStatement isLoggedIn={isLoggedIn} />
    </>
  );
}
