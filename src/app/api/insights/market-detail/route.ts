import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyUnlockCookie, UNLOCK_COOKIE_NAME } from '@/lib/unlock';

/**
 * Tier-2 payload: "the market around your role." Exact demand counts + trend,
 * hiring hotspots, and the deep blended cuts. Named employers and req-level
 * reads are call-only and are never in this payload.
 */
export async function GET(request: NextRequest) {
  const session = verifyUnlockCookie(request.cookies.get(UNLOCK_COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ error: 'locked' }, { status: 401 });
  }

  const roleKey = request.nextUrl.searchParams.get('role') ?? 'AA';
  // Director+ comp is call-only; it never rides in any self-serve payload.
  if (['DIR', 'VP', 'EXEC'].includes(roleKey)) {
    return NextResponse.json({ error: 'call_only' }, { status: 403 });
  }
  const db = supabaseAdmin();

  const [cellsRes, jobsRes] = await Promise.all([
    db
      .from('benchmark_published')
      .select(
        'role_key, role_family, seniority_level, region, work_model, employer_type, credential, n_observations, blended_p10, blended_p25, blended_median, blended_p75, blended_p90, demand_count, demand_delta_30d, spark, confidence_tier, updated_at',
      )
      .eq('role_family', roleKey),
    db
      .from('raw_jobs')
      .select('state, posted_date, id, job_classification!inner(role_family, is_epic_it_role)', { count: 'exact', head: false })
      .eq('job_classification.role_family', roleKey)
      .eq('job_classification.is_epic_it_role', true)
      .not('posted_date', 'is', null)
      .gte('posted_date', new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10))
      .limit(5000),
  ]);

  if (cellsRes.error) {
    return NextResponse.json({ error: 'read failed' }, { status: 500 });
  }

  type Cell = Record<string, unknown> & {
    region: string; seniority_level: string; work_model: string; employer_type: string; credential: string;
    n_observations: number;
    blended_p10: number; blended_p25: number; blended_median: number; blended_p75: number; blended_p90: number;
  };
  const cells = (cellsRes.data ?? []) as Cell[];
  const national = cells.find(
    (c) => c.region === 'National' && c.seniority_level === 'all' && c.work_model === 'all' && c.employer_type === 'all' && c.credential === 'all',
  );

  const toPercentiles = (c: Cell) => ({
    p10: Number(c.blended_p10),
    p25: Number(c.blended_p25),
    p50: Number(c.blended_median),
    p75: Number(c.blended_p75),
    p90: Number(c.blended_p90),
  });

  const cuts = cells
    .filter(
      (c) =>
        c.region === 'National' &&
        c.seniority_level === 'all' &&
        ((c.work_model !== 'all' && c.employer_type === 'all' && c.credential === 'all') ||
          (c.work_model === 'all' && c.employer_type !== 'all' && c.credential === 'all') ||
          (c.work_model === 'all' && c.employer_type === 'all' && c.credential !== 'all')),
    )
    .map((c) => ({
      dimension: c.work_model !== 'all' ? 'workModel' : c.employer_type !== 'all' ? 'employerType' : 'credential',
      label: String(c.work_model !== 'all' ? c.work_model : c.employer_type !== 'all' ? c.employer_type : c.credential),
      n: c.n_observations,
      blended: toPercentiles(c),
    }));

  // Hotspots: openings by state → region shares
  const stateCounts = new Map<string, number>();
  for (const j of (jobsRes.data ?? []) as { state: string | null }[]) {
    if (!j.state) continue;
    stateCounts.set(j.state, (stateCounts.get(j.state) ?? 0) + 1);
  }
  const totalOpenings = [...stateCounts.values()].reduce((s, n) => s + n, 0);
  const hotspots = [...stateCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([state, openings]) => ({
      label: state,
      kind: 'region' as const,
      share: totalOpenings ? Math.round((openings / totalOpenings) * 1000) / 1000 : 0,
      openings,
    }));

  return NextResponse.json({
    roleKey,
    region: 'National',
    demandCount: Number(national?.demand_count ?? 0),
    demandDelta30d: national?.demand_delta_30d === null || national?.demand_delta_30d === undefined ? null : Number(national.demand_delta_30d),
    demandTrend: [],
    hotspots,
    cuts,
    postedTrend: Array.isArray(national?.spark)
      ? (national!.spark as number[]).map((median, i) => ({ month: `m${i}`, median, n: 0 }))
      : [],
    updatedAt: (national?.updated_at as string) ?? new Date().toISOString(),
  });
}
