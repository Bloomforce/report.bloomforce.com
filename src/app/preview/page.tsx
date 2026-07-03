import type { Metadata } from 'next';
import { getInsightsData } from '@/lib/insights/client';
import { InsightsPage } from '@/components/InsightsPage';

export const revalidate = 3600;

// Unlisted copy-review staging for the living benchmark. Swap this back to
// src/app/page.tsx (and restore the evergreen metadata in layout.tsx) to launch.
export const metadata: Metadata = {
  title: 'The Living EHR Talent Benchmark (preview) | Bloomforce Insights',
  robots: { index: false, follow: false },
};

export default async function InsightsPreview() {
  const data = await getInsightsData();
  return <InsightsPage data={data} />;
}
