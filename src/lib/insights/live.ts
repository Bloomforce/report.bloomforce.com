import { supabasePublic } from '@/lib/supabase/public';
import { FIXTURE_DATA } from './fixtures';
import type {
  BenchmarkRow,
  DemandCell,
  FreshnessMeta,
  InsightsData,
  PulseItem,
  RoleOption,
  Seniority,
  SentimentCut,
  WorkModelCut,
} from './types';

const ROLE_LABELS: Record<string, { label: string; group: string; sort: number }> = {
  AA: { label: 'Application Analyst', group: 'Individual contributors', sort: 1 },
  INT: { label: 'Integration / Interface Analyst', group: 'Individual contributors', sort: 2 },
  BI: { label: 'BI / Reporting Developer', group: 'Individual contributors', sort: 3 },
  SEC: { label: 'Security / Identity Analyst', group: 'Individual contributors', sort: 4 },
  TECH: { label: 'Technical / Infrastructure', group: 'Individual contributors', sort: 5 },
  PT: { label: 'Principal Trainer', group: 'Individual contributors', sort: 6 },
  CT: { label: 'Credentialed Trainer', group: 'Individual contributors', sort: 7 },
  CI: { label: 'Clinical Informatics', group: 'Individual contributors', sort: 8 },
  PM: { label: 'Project / Program Manager', group: 'Individual contributors', sort: 9 },
  MGR: { label: 'IT Manager', group: 'Leadership', sort: 10 },
  DIR: { label: 'IT Director', group: 'Leadership', sort: 11 },
  VP: { label: 'VP of IT / IS', group: 'Leadership', sort: 12 },
  EXEC: { label: 'CIO / CMIO / CNIO', group: 'Leadership', sort: 13 },
};

export async function fetchLiveInsightsData(): Promise<InsightsData> {
  const db = supabasePublic();
  const [bench, sent, pulse, demand, fresh] = await Promise.all([
    db.from('benchmark_public').select('*'),
    db.from('sentiment_published').select('*'),
    db.from('pulse_published').select('*').eq('active', true).order('ts', { ascending: false }).limit(12),
    db.from('demand_published').select('*').order('share', { ascending: false }),
    db.from('freshness_published').select('*').limit(1).single(),
  ]);
  for (const r of [bench, sent, pulse, demand, fresh]) {
    if (r.error) throw new Error(`insights read failed: ${r.error.message}`);
  }
  if (!bench.data?.length) throw new Error('benchmark_public is empty — seed not applied');

  const benchmarks: BenchmarkRow[] = (bench.data as Record<string, any>[])
    .filter((r) => r.blended_median !== null)
    .map((r) => ({
      roleKey: r.role_key,
      roleFamily: r.role_family,
      roleName: ROLE_LABELS[r.role_family]?.label ?? r.role_family,
      seniority: r.seniority_level === 'all' ? 'ALL' : (r.seniority_level as Seniority),
      region: r.region,
      workModel: r.work_model ?? 'all',
      employerType: r.employer_type ?? 'all',
      n: r.n_observations,
      blended: {
        p10: Number(r.blended_p10),
        p25: Number(r.blended_p25),
        p50: Number(r.blended_median),
        p75: Number(r.blended_p75),
        p90: Number(r.blended_p90),
      },
      remoteShare: r.remote_share === null ? null : Number(r.remote_share),
      confidenceTier: r.confidence_tier,
      medianDelta90d: r.median_delta_90d === null ? null : Number(r.median_delta_90d),
      spark: Array.isArray(r.spark) ? r.spark.map(Number) : null,
      updatedAt: r.updated_at,
    }));

  const sentiment: SentimentCut[] = groupSentiment(sent.data as Record<string, any>[]);

  // C-suite is fully hidden from the public surface, including demand and pulse.
  const pulseItems: PulseItem[] = (pulse.data as Record<string, any>[])
    .filter((r) => r.role_key !== 'EXEC')
    .map((r) => ({
    id: r.id,
    ts: r.ts,
    kind: r.kind,
    text: r.text,
    roleKey: r.role_key ?? undefined,
    deltaValue: r.delta_value === null ? undefined : Number(r.delta_value),
    deltaUnit: r.delta_unit ?? undefined,
  }));

  const demandCells: DemandCell[] = (demand.data as Record<string, any>[])
    .filter((r) => r.key !== 'EXEC')
    .map((r) => ({
    key: r.key,
    label: ROLE_LABELS[r.key]?.label ?? r.label,
    share: Number(r.share),
    delta30d: r.delta_30d === null ? null : Number(r.delta_30d),
  }));

  const f = fresh.data as Record<string, any>;
  const freshness: FreshnessMeta = {
    benchmarkCells: f.benchmark_cells,
    totalRespondents: f.total_respondents,
    postingsIngested: f.postings_ingested,
    lastSurveyIngest: f.last_survey_ingest,
    lastPulseRefresh: f.last_pulse_refresh,
    asOf: f.as_of,
    windowLabel: f.window_label,
  };

  const familiesPresent = new Set(benchmarks.map((b) => b.roleFamily));
  const roles: RoleOption[] = Object.entries(ROLE_LABELS)
    .filter(([key]) => familiesPresent.has(key))
    .sort((a, b) => a[1].sort - b[1].sort)
    .map(([roleKey, v]) => ({ roleKey, label: v.label, group: v.group }));

  const regions = ['National', ...new Set(benchmarks.map((b) => b.region).filter((r) => r !== 'National'))];

  const workModels: WorkModelCut[] = buildWorkModels(benchmarks);

  return { benchmarks, sentiment, pulse: pulseItems, demand: demandCells, workModels, freshness, roles, regions };
}

function groupSentiment(rows: Record<string, any>[]): SentimentCut[] {
  const groups = new Map<string, SentimentCut>();
  const prevYear = new Map<string, number>();

  for (const r of rows) {
    if (r.survey_year === 2024 && r.role_family === 'all' && r.work_model === 'all') {
      prevYear.set(`${r.metric_key}|${r.option_key}`, Number(r.pct));
    }
  }
  for (const r of rows) {
    const gk = [r.metric_key, r.survey_year, r.role_family, r.work_model].join('|');
    if (!groups.has(gk)) {
      groups.set(gk, {
        id: gk,
        metricKey: r.metric_key,
        question: r.metric_label ?? r.metric_key,
        surveyYear: r.survey_year,
        cohort: {
          roleFamily: r.role_family === 'all' ? undefined : r.role_family,
          workModel: r.work_model === 'all' ? undefined : r.work_model,
        },
        n: r.n,
        values: [],
        updatedAt: r.updated_at,
      });
    }
    const isAllCohort = r.role_family === 'all' && r.work_model === 'all';
    const prev = isAllCohort && r.survey_year === 2025 ? prevYear.get(`${r.metric_key}|${r.option_key}`) : undefined;
    groups.get(gk)!.values.push({
      key: r.option_key,
      label: r.option_label ?? r.option_key,
      value: Number(r.pct),
      deltaYoY: prev === undefined ? null : Math.round((Number(r.pct) - prev) * 1000) / 1000,
    });
  }
  for (const g of groups.values()) g.values.sort((a, b) => b.value - a.value);
  return [...groups.values()];
}

function buildWorkModels(benchmarks: BenchmarkRow[]): WorkModelCut[] {
  const out: WorkModelCut[] = [];
  const cuts = benchmarks.filter(
    (b) => b.roleFamily === 'AA' && b.seniority === 'ALL' && b.region === 'National' && b.workModel !== 'all' && b.employerType === 'all',
  );
  const totalN = cuts.reduce((s, c) => s + c.n, 0);
  for (const wm of ['remote', 'hybrid', 'onsite'] as const) {
    const c = cuts.find((x) => x.workModel === wm);
    if (c) out.push({ workModel: wm, share: totalN ? c.n / totalN : 0, median: c.blended.p50, n: c.n });
  }
  return out.length ? out : FIXTURE_DATA.workModels;
}
