'use client';

import { GateProvider } from '@/components/gate/GateProvider';
import { LeadCaptureModal } from '@/components/gate/LeadCaptureModal';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/sections/HeroSection';
import { KeyFindingsSection } from '@/components/sections/KeyFindingsSection';
import { SalaryExplorerSection } from '@/components/sections/SalaryExplorerSection';
import { WorkforceSentimentSection } from '@/components/sections/WorkforceSentimentSection';
import { IndustryTrendsSection } from '@/components/sections/IndustryTrendsSection';
import { MethodologySection } from '@/components/sections/MethodologySection';
import { CTASection } from '@/components/sections/CTASection';

export default function Home() {
  return (
    <GateProvider>
      <Navbar />
      <main>
        <HeroSection />
        <KeyFindingsSection />
        <SalaryExplorerSection />
        <WorkforceSentimentSection />
        <IndustryTrendsSection />
        <MethodologySection />
        <CTASection />
      </main>
      <Footer />
      <LeadCaptureModal />
    </GateProvider>
  );
}
