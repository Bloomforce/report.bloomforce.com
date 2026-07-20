import type { Metadata } from 'next';
import { MarketExplorerDashboard } from '@/components/admin/MarketExplorerDashboard';
import { getInsightsData } from '@/lib/insights/client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Market Explorer | Bloomforce',
  robots: { index: false, follow: false },
};

export default async function MarketExplorerPage() {
  const data = await getInsightsData();
  return <MarketExplorerDashboard data={data} />;
}
