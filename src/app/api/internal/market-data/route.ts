import { createHash, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getInsightsData } from '@/lib/insights/client';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type DataRow = Record<string, unknown>;

function securelyEqual(left: string, right: string): boolean {
  const leftHash = createHash('sha256').update(left).digest();
  const rightHash = createHash('sha256').update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function authorized(request: NextRequest, expectedKey: string): boolean {
  const header = request.headers.get('authorization') ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return Boolean(match?.[1] && securelyEqual(match[1].trim(), expectedKey));
}

async function exactCount(
  table: string,
  filters: Array<[string, string | number | boolean]> = [],
): Promise<number> {
  let query = supabaseAdmin().from(table).select('*', { count: 'exact', head: true });
  for (const [column, value] of filters) query = query.eq(column, value);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function getOperationsSummary() {
  const db = supabaseAdmin();
  const [
    baseline2024,
    baseline2025,
    acceptedContinuous,
    pending,
    reviewRequired,
    rejected,
    activePostings,
    publishedCells,
    runs,
    rawRecent,
  ] = await Promise.all([
    exactCount('survey_responses', [['is_baseline', true], ['survey_year', 2024]]),
    exactCount('survey_responses', [['is_baseline', true], ['survey_year', 2025]]),
    exactCount('survey_responses', [['is_baseline', false], ['status', 'accepted']]),
    exactCount('survey_responses', [['status', 'pending']]),
    exactCount('survey_responses', [['status', 'review_required']]),
    exactCount('survey_responses', [['status', 'rejected']]),
    exactCount('comp_observations', [['observation_type', 'posted'], ['in_benchmark', true]]),
    exactCount('benchmark_published'),
    db
      .from('ingest_runs')
      .select(
        'id,source,started_at,finished_at,status,rows_in,rows_upserted,rows_accepted,rows_review_required,rows_rejected,notes',
      )
      .order('started_at', { ascending: false })
      .limit(12),
    db
      .from('survey_submissions_raw')
      .select('instrument_key,processing_status,received_at')
      .order('received_at', { ascending: false })
      .limit(500),
  ]);

  if (runs.error) throw runs.error;
  if (rawRecent.error) throw rawRecent.error;

  const instruments = new Map<
    string,
    { received: number; waiting: number; lastReceivedAt: string | null }
  >();
  for (const row of (rawRecent.data ?? []) as DataRow[]) {
    const key = String(row.instrument_key ?? 'unknown');
    const item = instruments.get(key) ?? {
      received: 0,
      waiting: 0,
      lastReceivedAt: row.received_at ? String(row.received_at) : null,
    };
    item.received += 1;
    if (['received', 'review_required', 'error'].includes(String(row.processing_status))) {
      item.waiting += 1;
    }
    instruments.set(key, item);
  }

  return {
    available: true as const,
    counts: {
      baseline2024,
      baseline2025,
      acceptedContinuous,
      pending,
      reviewRequired,
      rejected,
      activePostings,
      publishedCells,
    },
    instruments: [...instruments.entries()].map(([key, value]) => ({ key, ...value })),
    recentRuns: runs.data ?? [],
  };
}

export async function GET(request: NextRequest) {
  const expectedKey = process.env.MARKET_DATA_INTERNAL_KEY?.trim();
  if (!expectedKey) {
    return NextResponse.json(
      { error: 'Market data service is not configured' },
      { status: 503 },
    );
  }
  if (!authorized(request, expectedKey)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const insights = await getInsightsData();
  let operations;
  try {
    operations = await getOperationsSummary();
  } catch (error) {
    console.error('[market-data] operations summary failed', error);
    operations = {
      available: false as const,
      error:
        error instanceof Error && error.message
          ? error.message
          : 'Operations data unavailable. Check the server-side Supabase key and table permissions.',
    };
  }

  return NextResponse.json(
    { insights, operations },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
