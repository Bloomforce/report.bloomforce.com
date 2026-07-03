import type { Metadata } from 'next';
import { getInsightsData } from '@/lib/insights/client';
import { ComingSoonPage } from '@/components/ComingSoonPage';

export const revalidate = 3600;

// Temporary: teaser holds the public page while the living benchmark is in
// copy review at /preview. To launch, render <InsightsPage data={data} /> here
// (see src/app/preview/page.tsx), restore layout.tsx metadata + Footer link,
// and delete /preview and this teaser.
export const metadata: Metadata = {
  title: 'The 2026 EHR Workforce Report — Something Different Is Coming | Bloomforce',
  description:
    'This year’s EHR workforce report won’t look like anything we’ve published before. 500+ professionals are already counted — take the 2026 survey to be in it.',
  openGraph: {
    title: 'Something Different Is Coming | Bloomforce Insights',
    description:
      'The next EHR workforce report won’t look like anything we’ve published before. Take the 2026 survey to be counted.',
    type: 'website',
  },
};

export default async function Home() {
  const data = await getInsightsData();
  return <ComingSoonPage totalRespondents={data.freshness.totalRespondents} />;
}
