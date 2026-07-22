import type { Metadata } from 'next';
import { EditorialBriefing } from '@/components/editorial/EditorialBriefing';
import { getInsightsData } from '@/lib/insights/client';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'The 2026 Executive Market Briefing (preview) | Bloomforce Insights',
  description:
    'A live executive briefing on EHR compensation, hiring demand, workforce expectations, and the decisions facing health system leaders.',
  robots: { index: false, follow: false },
};

export default async function EditorialPreview() {
  const data = await getInsightsData();
  return <EditorialBriefing data={data} />;
}
