'use client';

import Link from 'next/link';
import { GateProvider } from '@/components/gate/GateProvider';
import { LeadCaptureModal } from '@/components/gate/LeadCaptureModal';
import { Navbar } from '@/components/layout/Navbar';
import { SECTION_IDS } from '@/lib/constants';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/report-2025/sections/HeroSection';
import { KeyFindingsSection } from '@/components/report-2025/sections/KeyFindingsSection';
import { SalaryExplorerSection } from '@/components/report-2025/sections/SalaryExplorerSection';
import { WorkforceSentimentSection } from '@/components/report-2025/sections/WorkforceSentimentSection';
import { IndustryTrendsSection } from '@/components/report-2025/sections/IndustryTrendsSection';
import { MethodologySection } from '@/components/report-2025/sections/MethodologySection';
import { CTASection } from '@/components/report-2025/sections/CTASection';

function ArchiveBanner() {
  return (
    <div className="bg-navy text-white text-sm">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
        <span>
          You&apos;re viewing the archived 2025 report (surveyed Nov &apos;24 – Jan &apos;25).
        </span>
        <Link href="/" className="font-semibold text-primary-light underline underline-offset-2 hover:text-white transition-colors">
          See the live benchmark →
        </Link>
      </div>
    </div>
  );
}

export function Report2025() {
  return (
    <GateProvider>
      <ArchiveBanner />
      <Navbar
        items={[
          { label: 'Key Findings', href: `#${SECTION_IDS.keyFindings}` },
          { label: 'Salary Explorer', href: `#${SECTION_IDS.salaryExplorer}` },
          { label: 'Workforce Insights', href: `#${SECTION_IDS.sentiment}` },
          { label: 'Industry Trends', href: `#${SECTION_IDS.trends}` },
          { label: 'Methodology', href: `#${SECTION_IDS.methodology}` },
        ]}
      />
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
