import type { Metadata } from 'next';
import { getInsightsData } from '@/lib/insights/client';
import { ComingSoonPage } from '@/components/ComingSoonPage';

export const revalidate = 3600;

// Temporary: teaser holds the public page while the living benchmark is in
// copy review at /preview. To launch, render <InsightsPage data={data} /> here
// (see src/app/preview/page.tsx), restore layout.tsx metadata + Footer link,
// and delete /preview and this teaser.
export const metadata: Metadata = {
  title: 'The Living EHR Talent Benchmark — Coming Soon | Bloomforce Insights',
  description:
    'We’re blending verified salaries with thousands of live Epic-IT job postings into a living benchmark. Take the 2026 survey to be counted in it.',
  openGraph: {
    title: 'The Living EHR Talent Benchmark — Coming Soon | Bloomforce Insights',
    description:
      'Pay, demand, and sentiment by role, level, and market — updated continuously, not annually. Compiling now.',
    type: 'website',
  },
};

export default async function Home() {
  const data = await getInsightsData();
  return <ComingSoonPage freshness={data.freshness} />;
}
