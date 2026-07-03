import { getInsightsData } from '@/lib/insights/client';
import { InsightsPage } from '@/components/InsightsPage';

export const revalidate = 3600;

export default async function Home() {
  const data = await getInsightsData();
  return <InsightsPage data={data} />;
}
