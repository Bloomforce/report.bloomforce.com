'use client';

import { GateProvider } from '@/components/gate/GateProvider';
import { LeadCaptureModal } from '@/components/gate/LeadCaptureModal';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FreshnessBar } from '@/components/live/FreshnessBar';
import { BenchmarkProvider } from '@/components/benchmark/BenchmarkProvider';
import { FloatingBenchmarkChip } from '@/components/benchmark/FloatingBenchmarkChip';
import { MarketDetailSection } from '@/components/sections/MarketDetailSection';
import { HeroBenchmarkSection } from '@/components/sections/HeroBenchmarkSection';
import { MarketTerminalSection } from '@/components/sections/MarketTerminalSection';
import { OrgTypeSection } from '@/components/sections/OrgTypeSection';
import { SentimentStorySection } from '@/components/sections/SentimentStorySection';
import { TrendStorySection } from '@/components/sections/TrendStorySection';
import { CareerLadderSection } from '@/components/sections/CareerLadderSection';
import { MethodologyLiveSection } from '@/components/sections/MethodologyLiveSection';
import { FinalCTASection } from '@/components/sections/FinalCTASection';
import type { InsightsData } from '@/lib/insights/types';

export function InsightsPage({ data }: { data: InsightsData }) {
  return (
    <GateProvider>
      <BenchmarkProvider data={data}>
        <FreshnessBar meta={data.freshness} />
        <Navbar topClass="top-[38px]" />
        <main>
          <HeroBenchmarkSection />
          <OrgTypeSection />
          <MarketTerminalSection />
          <MarketDetailSection />
          <SentimentStorySection />
          <TrendStorySection />
          <CareerLadderSection />
          <MethodologyLiveSection />
          <FinalCTASection />
        </main>
        <Footer />
        <FloatingBenchmarkChip />
        <LeadCaptureModal />
      </BenchmarkProvider>
    </GateProvider>
  );
}
