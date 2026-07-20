import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { promotePendingSurveyResponses } from '@/lib/insights/survey-promotion';
import { refreshPublishedMarketData } from '@/lib/insights/market-refresh';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get('authorization') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = supabaseAdmin();
    const promotion = await promotePendingSurveyResponses(db);
    const refresh = await refreshPublishedMarketData(db);
    return NextResponse.json({ ok: true, promotion, refresh });
  } catch (error) {
    console.error('[insights-refresh]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Refresh failed' },
      { status: 500 },
    );
  }
}
