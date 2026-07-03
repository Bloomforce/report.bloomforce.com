import type {
  BenchmarkRow,
  DemandCell,
  FreshnessMeta,
  InsightsData,
  Percentiles,
  PulseItem,
  RoleOption,
  Seniority,
  SentimentCut,
  WorkModelCut,
} from './types';

/**
 * Development fixtures shaped exactly like the published Supabase views.
 * Numbers are anchored to the real 2025 survey (AA median ≈ $104k) so the UI
 * reads sensibly, but every value here is replaced by live data in
 * `client.ts` once the seed pipeline has run.
 */

const AS_OF = '2026-07-01T00:00:00Z';

const ROLES: { key: string; name: string; group: string; median: number; seniorities: Partial<Record<Seniority, number>> }[] = [
  { key: 'AA', name: 'Application Analyst', group: 'Individual contributors', median: 104000, seniorities: { L1: 82000, L2: 99000, L3: 118000, L4: 134000 } },
  { key: 'INT', name: 'Integration / Interface Analyst', group: 'Individual contributors', median: 109000, seniorities: { L2: 103000, L3: 121000 } },
  { key: 'BI', name: 'BI / Reporting Developer', group: 'Individual contributors', median: 101000, seniorities: { L2: 96000, L3: 114000 } },
  { key: 'TECH', name: 'Technical / Infrastructure', group: 'Individual contributors', median: 112000, seniorities: { L2: 105000, L3: 124000 } },
  { key: 'PM', name: 'Project / Program Manager', group: 'Individual contributors', median: 116000, seniorities: { L2: 108000, L3: 128000 } },
  { key: 'CI', name: 'Clinical Informatics', group: 'Individual contributors', median: 110000, seniorities: { L2: 102000, L3: 122000 } },
  { key: 'MGR', name: 'IT Manager', group: 'Leadership', median: 132000, seniorities: { M1: 132000 } },
  { key: 'DIR', name: 'IT Director', group: 'Leadership', median: 158000, seniorities: { M2: 158000 } },
  { key: 'VP', name: 'VP of IT / IS', group: 'Leadership', median: 205000, seniorities: { M3: 205000 } },
  { key: 'EXEC', name: 'CIO / CMIO / CNIO', group: 'Leadership', median: 268000, seniorities: { exec: 268000 } },
];

const REGIONS = ['National', 'Northeast', 'Southeast', 'Midwest', 'Southwest', 'West'];
const REGION_FACTOR: Record<string, number> = {
  National: 1,
  Northeast: 1.06,
  Southeast: 0.94,
  Midwest: 0.96,
  Southwest: 0.97,
  West: 1.09,
};

function spread(median: number): Percentiles {
  return {
    p10: Math.round(median * 0.72),
    p25: Math.round(median * 0.85),
    p50: Math.round(median),
    p75: Math.round(median * 1.17),
    p90: Math.round(median * 1.38),
  };
}

function sparkFrom(median: number, seed: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < 12; i++) {
    const wave = Math.sin((i + seed) * 1.3) * 0.015 + (i / 11) * 0.03;
    out.push(Math.round(median * (0.97 + wave)));
  }
  return out;
}

function buildBenchmarks(): BenchmarkRow[] {
  const rows: BenchmarkRow[] = [];
  ROLES.forEach((role, ri) => {
    const levels: (Seniority | 'ALL')[] = ['ALL', ...(Object.keys(role.seniorities) as Seniority[])];
    for (const region of REGIONS) {
      for (const seniority of levels) {
        const base = seniority === 'ALL' ? role.median : role.seniorities[seniority as Seniority]!;
        const median = Math.round(base * REGION_FACTOR[region]);
        const thin = region !== 'National' && seniority !== 'ALL';
        if (thin && (ri > 5 || seniority === 'L4')) continue;
        rows.push({
          roleKey: seniority === 'ALL' ? role.key : `${role.key}.${seniority}`,
          roleFamily: role.key,
          roleName: role.name,
          seniority,
          region,
          workModel: 'all',
          employerType: 'all',
          n: region === 'National' ? (seniority === 'ALL' ? 120 - ri * 9 : 34) : thin ? 9 : 22,
          blended: spread(median),
          remoteShare: role.group === 'Leadership' ? 0.41 : 0.64,
          confidenceTier: region === 'National' ? (ri < 4 ? 'direct' : 'blended') : thin ? 'modeled' : 'blended',
          medianDelta90d: [2100, 1400, -600, 900, 1800, 0, 2600, 3100, 4200, 5100][ri] ?? null,
          spark: sparkFrom(median, ri),
          updatedAt: AS_OF,
        });
      }
    }
  });
  return rows;
}

const SENTIMENT: SentimentCut[] = [
  {
    id: 'wlb-2025',
    metricKey: 'satisfaction_wlb',
    question: 'Satisfied with work-life balance',
    surveyYear: 2025,
    cohort: {},
    n: 300,
    values: [
      { key: 'satisfied', label: 'Satisfied', value: 0.84, deltaYoY: 0.12 },
      { key: 'neutral', label: 'Neutral', value: 0.09, deltaYoY: -0.05 },
      { key: 'dissatisfied', label: 'Dissatisfied', value: 0.07, deltaYoY: -0.07 },
    ],
    updatedAt: AS_OF,
  },
  {
    id: 'remote-2025',
    metricKey: 'remote_share',
    question: 'Work location',
    surveyYear: 2025,
    cohort: {},
    n: 300,
    values: [
      { key: 'remote', label: 'Fully remote', value: 0.64, deltaYoY: 0.03 },
      { key: 'hybrid', label: 'Hybrid', value: 0.27, deltaYoY: -0.01 },
      { key: 'onsite', label: 'In office', value: 0.09, deltaYoY: -0.02 },
    ],
    updatedAt: AS_OF,
  },
  {
    id: 'rto-2025',
    metricKey: 'rto_response',
    question: 'If required to return to the office',
    surveyYear: 2025,
    cohort: {},
    n: 292,
    values: [
      { key: 'look', label: 'Would look for a new job', value: 0.58, deltaYoY: 0.04 },
      { key: 'negotiate', label: 'Would negotiate', value: 0.34, deltaYoY: -0.02 },
      { key: 'comply', label: 'Would comply', value: 0.08, deltaYoY: -0.02 },
    ],
    updatedAt: AS_OF,
  },
  {
    id: 'ma-2025',
    metricKey: 'ma_activity',
    question: 'Experienced M&A in the last 3 years',
    surveyYear: 2025,
    cohort: {},
    n: 297,
    values: [
      { key: 'yes', label: 'Yes', value: 0.33, deltaYoY: 0.05 },
      { key: 'no', label: 'No', value: 0.67, deltaYoY: -0.05 },
    ],
    updatedAt: AS_OF,
  },
  {
    id: 'layoffs-2025',
    metricKey: 'layoffs',
    question: 'Company conducted a layoff / RIF in the last year',
    surveyYear: 2025,
    cohort: {},
    n: 295,
    values: [
      { key: 'yes', label: 'Yes', value: 0.34, deltaYoY: 0.06 },
      { key: 'no', label: 'No', value: 0.66, deltaYoY: -0.06 },
    ],
    updatedAt: AS_OF,
  },
];

const PULSE: PulseItem[] = [
  { id: 'p1', ts: '2026-06-29T00:00:00Z', kind: 'demand_shift', text: 'Remote share of new Application Analyst postings up 4 pts this month', roleKey: 'AA', deltaValue: 4, deltaUnit: 'pts' },
  { id: 'p2', ts: '2026-06-26T00:00:00Z', kind: 'benchmark_move', text: 'Integration Analyst benchmark moved up on 28 fresh data points', roleKey: 'INT', deltaValue: 2100, deltaUnit: '$' },
  { id: 'p3', ts: '2026-06-24T00:00:00Z', kind: 'demand_shift', text: 'Willow demand up 12% — pharmacy go-lives driving new postings', deltaValue: 12, deltaUnit: '%' },
  { id: 'p4', ts: '2026-06-19T00:00:00Z', kind: 'new_data', text: '31 new survey responses folded into the rolling benchmark this week' },
  { id: 'p5', ts: '2026-06-15T00:00:00Z', kind: 'benchmark_move', text: 'Director postings hit a 12-month high median', roleKey: 'DIR', deltaValue: 3100, deltaUnit: '$' },
];

const DEMAND: DemandCell[] = [
  { key: 'AA', label: 'Application Analyst', share: 0.31, delta30d: 0.04 },
  { key: 'INT', label: 'Integration', share: 0.14, delta30d: 0.02 },
  { key: 'BI', label: 'BI / Reporting', share: 0.12, delta30d: -0.01 },
  { key: 'TECH', label: 'Technical / Infra', share: 0.16, delta30d: 0.01 },
  { key: 'PM', label: 'Project Mgmt', share: 0.09, delta30d: 0.0 },
  { key: 'CI', label: 'Clinical Informatics', share: 0.06, delta30d: 0.01 },
  { key: 'MGR', label: 'Manager+', share: 0.12, delta30d: 0.03 },
];

const WORK_MODELS: WorkModelCut[] = [
  { workModel: 'remote', share: 0.52, median: 108000, n: 410 },
  { workModel: 'hybrid', share: 0.29, median: 102000, n: 226 },
  { workModel: 'onsite', share: 0.19, median: 97000, n: 149 },
];

const FRESHNESS: FreshnessMeta = {
  benchmarkCells: 167,
  totalRespondents: 584,
  postingsIngested: 2078,
  lastSurveyIngest: '2026-06-19T00:00:00Z',
  lastPulseRefresh: '2026-06-29T00:00:00Z',
  asOf: AS_OF,
  windowLabel: "rolling 12 months · Jul '25 – Jun '26",
};

const ROLE_OPTIONS: RoleOption[] = ROLES.map((r) => ({ roleKey: r.key, label: r.name, group: r.group }));

export const FIXTURE_DATA: InsightsData = {
  benchmarks: buildBenchmarks(),
  sentiment: SENTIMENT,
  pulse: PULSE,
  demand: DEMAND,
  workModels: WORK_MODELS,
  freshness: FRESHNESS,
  roles: ROLE_OPTIONS,
  regions: REGIONS,
};
