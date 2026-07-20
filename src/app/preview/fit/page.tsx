import type { Metadata } from 'next';
import { getInsightsData } from '@/lib/insights/client';
import { FitScrolly } from '@/components/scrolly2/FitScrolly';

export const revalidate = 3600;

// Unlisted scrollytelling homepage candidate ("Mutual Fit, By the Numbers"),
// rendered from the same live data as /preview.
export const metadata: Metadata = {
  title: 'Mutual Fit, By the Numbers (preview) | Bloomforce Insights',
  robots: { index: false, follow: false },
};

export default async function FitPreview() {
  const data = await getInsightsData();
  return <FitScrolly data={data} />;
}
