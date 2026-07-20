import type { Metadata } from 'next';
import { getInsightsData } from '@/lib/insights/client';
import { BriefingScrolly } from '@/components/scrolly2/BriefingScrolly';

export const revalidate = 3600;

// Unlisted scrollytelling homepage candidate ("The Benchmark Briefing"),
// rendered from the same live data as /preview.
export const metadata: Metadata = {
  title: 'The Benchmark Briefing (preview) | Bloomforce Insights',
  robots: { index: false, follow: false },
};

export default async function BriefingPreview() {
  const data = await getInsightsData();
  return <BriefingScrolly data={data} />;
}
