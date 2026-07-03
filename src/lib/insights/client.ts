import type { InsightsData } from './types';
import { FIXTURE_DATA } from './fixtures';

/**
 * Server-side data access for the public page. Reads the anon-safe Supabase
 * views when configured; falls back to fixtures so the UI always renders
 * (local dev before the seed, preview deploys without env vars).
 */
export async function getInsightsData(): Promise<InsightsData> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return FIXTURE_DATA;
  }
  try {
    const { fetchLiveInsightsData } = await import('./live');
    return await fetchLiveInsightsData();
  } catch (error) {
    console.error('[insights] live fetch failed, serving fixtures', error);
    return FIXTURE_DATA;
  }
}
