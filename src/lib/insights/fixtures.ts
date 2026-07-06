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
  // Director, VP, and C-suite are call-only: they never appear in the public
  // dataset, so the fixtures mirror the guarded benchmark_public view.
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
  {
    id: 'ai-impact-2025',
    metricKey: 'ai_impact',
    question: 'Expected AI impact on role',
    surveyYear: 2025,
    cohort: {},
    n: 225,
    values: [
      { key: 'no_impact', label: 'Little to no impact', value: 0.45, deltaYoY: null },
      { key: 'enhance', label: 'Will enhance my work', value: 0.43, deltaYoY: null },
      { key: 'transform', label: 'Will fundamentally change my role', value: 0.12, deltaYoY: null },
    ],
    updatedAt: AS_OF,
  },
  {
    id: 'ai-org-2025',
    metricKey: 'ai_org',
    question: 'Org has dedicated AI/ML people',
    surveyYear: 2025,
    cohort: {},
    n: 66,
    values: [
      { key: 'have', label: 'Already staffed', value: 0.5, deltaYoY: null },
      { key: 'unsure', label: 'Unsure', value: 0.3, deltaYoY: null },
      { key: 'no_plan', label: 'No plans', value: 0.17, deltaYoY: null },
      { key: 'plan', label: 'Planning to hire', value: 0.03, deltaYoY: null },
    ],
    updatedAt: AS_OF,
  },
  {
    id: 'job-seeking-2025',
    metricKey: 'job_seeking',
    question: 'Job-search posture',
    surveyYear: 2025,
    cohort: {},
    n: 283,
    values: [
      { key: 'passive', label: 'Passively exploring', value: 0.44, deltaYoY: 0.08 },
      { key: 'none', label: 'No plans to move', value: 0.25, deltaYoY: 0.02 },
      { key: 'planning', label: 'Planning to explore', value: 0.19, deltaYoY: -0.05 },
      { key: 'active', label: 'Actively applying', value: 0.12, deltaYoY: -0.06 },
    ],
    updatedAt: AS_OF,
  },
  {
    id: 'fair-comp-2025',
    metricKey: 'fair_comp',
    question: 'Feel fairly compensated',
    surveyYear: 2025,
    cohort: {},
    n: 283,
    values: [
      { key: 'yes', label: 'Fairly paid', value: 0.52, deltaYoY: null },
      { key: 'no', label: 'Underpaid', value: 0.48, deltaYoY: null },
    ],
    updatedAt: AS_OF,
  },
  {
    id: 'mgr-remote-2025',
    metricKey: 'mgr_remote_view',
    question: 'Managers on remote productivity',
    surveyYear: 2025,
    cohort: {},
    n: 58,
    values: [
      { key: 'equal', label: 'Just as productive', value: 0.52, deltaYoY: null },
      { key: 'more', label: 'More productive', value: 0.34, deltaYoY: null },
      { key: 'less', label: 'Less productive', value: 0.14, deltaYoY: null },
    ],
    updatedAt: AS_OF,
  },
  {
    id: 'ma-stronger-2025',
    metricKey: 'ma_stronger',
    question: 'Stronger position after M&A',
    surveyYear: 2025,
    cohort: {},
    n: 101,
    values: [
      { key: 'yes', label: 'Stronger', value: 0.43, deltaYoY: null },
      { key: 'unsure', label: 'Unsure', value: 0.33, deltaYoY: null },
      { key: 'no', label: 'Not stronger', value: 0.25, deltaYoY: null },
    ],
    updatedAt: AS_OF,
  },
  {
    id: 'mobility-2025',
    metricKey: 'mobility_role',
    question: 'Path to the next promotion',
    surveyYear: 2025,
    cohort: {},
    n: 58,
    values: [
      { key: 'unclear', label: 'No clear path', value: 0.45, deltaYoY: null },
      { key: 'blocked', label: 'Blocked, waiting on a seat to open', value: 0.33, deltaYoY: null },
      { key: 'clear', label: 'Clear path up', value: 0.22, deltaYoY: null },
    ],
    updatedAt: AS_OF,
  },
  {
    id: 'turnover-2025',
    metricKey: 'turnover',
    question: 'Department turnover',
    surveyYear: 2025,
    cohort: {},
    n: 58,
    values: [
      { key: 'low', label: 'Low', value: 0.62, deltaYoY: null },
      { key: 'somewhat', label: 'Somewhat high', value: 0.26, deltaYoY: null },
      { key: 'high', label: 'High and disruptive', value: 0.12, deltaYoY: null },
    ],
    updatedAt: AS_OF,
  },
  {
    id: 'recognized-2025',
    metricKey: 'recognized',
    question: 'Skills recognized by manager/team',
    surveyYear: 2025,
    cohort: {},
    n: 225,
    values: [
      { key: 'yes', label: 'Recognized', value: 0.73, deltaYoY: null },
      { key: 'no', label: 'Not recognized', value: 0.27, deltaYoY: null },
    ],
    updatedAt: AS_OF,
  },
];

const PULSE: PulseItem[] = [
  { id: 'p1', ts: '2026-06-29T00:00:00Z', kind: 'demand_shift', text: 'Remote share of new Application Analyst postings up 4 pts this month', roleKey: 'AA', deltaValue: 4, deltaUnit: 'pts' },
  { id: 'p2', ts: '2026-06-26T00:00:00Z', kind: 'benchmark_move', text: 'Integration Analyst benchmark moved up on 28 fresh data points', roleKey: 'INT', deltaValue: 2100, deltaUnit: '$' },
  { id: 'p3', ts: '2026-06-24T00:00:00Z', kind: 'demand_shift', text: 'Pharmacy system demand up 12% as new rollouts drive fresh postings', deltaValue: 12, deltaUnit: '%' },
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
