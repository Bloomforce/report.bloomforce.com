import { FAMILY_LABEL } from '../lib/classify';
import { iqrTrim, median, percentile } from '../lib/normalize';
import type { SurveyRecord } from './load-survey';
import type { UmObservation } from './load-um';
import type { JobRecord } from './load-jobs';
import { postedMidpoint } from './load-jobs';

export interface Observation {
  id: string;
  source: string;
  observation_type: 'posted' | 'actual';
  role_family: string;
  role_key: string;
  seniority_level: string | null;
  region: string | null;
  work_model: string | null;
  employer_type: string | null;
  credential: string | null;
  period: string;
  value: number;
  low: number | null;
  high: number | null;
  in_benchmark: boolean;
  survey_year: number | null;
  external_ref: string | null;
  raw_job_id: string | null;
  company: string | null; // not persisted; used for per-employer caps
}

export const MIN_CELL_N = 5;
export const MIN_SENTIMENT_N = 10;
export const DIRECT_N = 15;
const POSTED_WEIGHT = 0.5;
const EMPLOYER_CELL_CAP = 0.4;

const PCTS = [10, 25, 50, 75, 90] as const;

export function buildObservations(
  surveys: SurveyRecord[],
  um: UmObservation[],
  jobs: JobRecord[],
  asOf: Date,
): Observation[] {
  const obs: Observation[] = [];
  const period = `${asOf.toISOString().slice(0, 7)}-01`;

  for (const s of surveys) {
    if (s.base_comp === null || !s.role_family || !s.role_key) continue;
    const total = s.base_comp + (s.bonus_comp ?? 0);
    obs.push({
      id: crypto.randomUUID(),
      source: 'survey',
      observation_type: 'actual',
      role_family: s.role_family,
      role_key: s.role_key,
      seniority_level: s.seniority_level,
      region: s.region,
      work_model: s.work_model,
      employer_type: s.employer_type,
      credential: s.credential,
      period: `${s.submitted_at.slice(0, 7)}-01`,
      value: total,
      low: null,
      high: null,
      in_benchmark: s.survey_year === 2025, // the 2024 wave feeds trends, not the current benchmark
      survey_year: s.survey_year,
      external_ref: s.external_id,
      raw_job_id: null,
      company: null,
    });
  }

  for (const u of um) {
    obs.push({
      id: crypto.randomUUID(),
      source: 'public_record',
      observation_type: 'actual',
      role_family: u.role_family,
      role_key: u.role_key,
      seniority_level: u.seniority_level,
      region: u.region,
      work_model: null,
      employer_type: u.employer_type,
      credential: null,
      period: u.period,
      value: u.base_comp,
      low: null,
      high: null,
      in_benchmark: true,
      survey_year: null,
      external_ref: u.external_ref,
      raw_job_id: null,
      company: 'university_of_michigan',
    });
  }

  // Posted: classified Epic-IT, non-contract, with a usable range.
  // Employer-template dedupe: an employer posting the same midpoint over and
  // over (templated reqs) contributes at most 3 rows per exact value.
  const templateCount = new Map<string, number>();
  for (const j of jobs) {
    const c = j.classification;
    if (!c.isEpicIt || !c.family || j.is_contractish) continue;
    const mid = postedMidpoint(j);
    if (!mid) continue;
    const tKey = `${j.company ?? '?'}|${mid.value}`;
    const seen = templateCount.get(tKey) ?? 0;
    templateCount.set(tKey, seen + 1);
    obs.push({
      id: crypto.randomUUID(),
      source: 'apify_hiringcafe',
      observation_type: 'posted',
      role_family: c.family,
      role_key: c.level ? `${c.family}.${c.level}` : c.family,
      seniority_level: c.level,
      region: j.region,
      work_model: j.workplace_type,
      employer_type: null,
      credential: null,
      period: j.posted_date ? `${j.posted_date.slice(0, 7)}-01` : period,
      value: mid.value,
      low: mid.low,
      high: mid.high,
      in_benchmark: seen < 3,
      survey_year: null,
      external_ref: null,
      raw_job_id: j.source_job_id, // remapped to the raw_jobs uuid by run-all
      company: j.company,
    });
  }

  // Per-family 1.5×IQR trim on the benchmark-eligible posted values
  for (const family of new Set(obs.map((o) => o.role_family))) {
    const posted = obs.filter((o) => o.role_family === family && o.observation_type === 'posted' && o.in_benchmark);
    const surviving = new Set(iqrTrim(posted.map((o) => o.value)));
    for (const o of posted) if (!surviving.has(o.value)) o.in_benchmark = false;
  }
  return obs;
}

export interface BenchmarkCell {
  role_key: string;
  role_family: string;
  module: string;
  seniority_level: string;
  region: string;
  work_model: string;
  employer_type: string;
  credential: string;
  period: string;
  n_observations: number;
  n_posted: number;
  n_actual: number;
  p10: number; p25: number; p50: number; p75: number; p90: number;
  blended_p10: number; blended_p25: number; blended_median: number; blended_p75: number; blended_p90: number;
  posted_median: number | null;
  actual_median: number | null;
  remote_share: number | null;
  demand_count: number;
  confidence_tier: string;
  median_delta_90d: number | null;
  demand_delta_30d: number | null;
  spark: number[] | null;
}

/** Cap any single employer at EMPLOYER_CELL_CAP of a cell's rows (drop overflow deterministically). */
function capEmployers(rows: Observation[]): Observation[] {
  const total = rows.length;
  if (total < MIN_CELL_N) return rows;
  const byCompany = new Map<string, Observation[]>();
  for (const o of rows) {
    const key = o.company ?? `__uncapped_${o.id}`;
    if (!byCompany.has(key)) byCompany.set(key, []);
    byCompany.get(key)!.push(o);
  }
  const cap = Math.max(2, Math.floor(total * EMPLOYER_CELL_CAP));
  const out: Observation[] = [];
  for (const group of byCompany.values()) {
    out.push(...(group.length > cap ? group.slice(0, cap) : group));
  }
  return out;
}

function blendPercentiles(actual: number[], posted: number[]) {
  const a = [...actual].sort((x, y) => x - y);
  const p = [...posted].sort((x, y) => x - y);
  const w = a.length + p.length === 0 ? 0 : a.length / (a.length + POSTED_WEIGHT * p.length);
  const out: Record<string, number> = {};
  for (const pct of PCTS) {
    const av = a.length ? percentile(a, pct) : null;
    const pv = p.length ? percentile(p, pct) : null;
    const blended = av !== null && pv !== null ? w * av + (1 - w) * pv : (av ?? pv)!;
    out[`p${pct}`] = Math.round(blended);
  }
  return out as { p10: number; p25: number; p50: number; p75: number; p90: number };
}

function monthsBack(asOf: Date, n: number): string {
  const d = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() - n, 1));
  return d.toISOString().slice(0, 10);
}

export function publishBenchmark(obs: Observation[], jobs: JobRecord[], asOf: Date): BenchmarkCell[] {
  const period = `${asOf.toISOString().slice(0, 7)}-01`;
  const bench = obs.filter((o) => o.in_benchmark);
  const families = [...new Set(bench.map((o) => o.role_family))];
  const regions = ['National', 'Northeast', 'Southeast', 'Midwest', 'Southwest', 'West'];

  const epicJobs = jobs.filter((j) => j.classification.isEpicIt && j.classification.family && !j.is_contractish);
  const cutoff12 = monthsBack(asOf, 12);
  const demandByFamily = new Map<string, number>();
  for (const j of epicJobs) {
    if (!j.posted_date || j.posted_date < cutoff12) continue;
    demandByFamily.set(j.classification.family!, (demandByFamily.get(j.classification.family!) ?? 0) + 1);
  }

  const cells: BenchmarkCell[] = [];

  function makeCell(opts: {
    family: string; level: string | null; region: string; workModel: string; employerType: string; credential: string;
  }): BenchmarkCell | null {
    const { family, level, region, workModel, employerType, credential } = opts;
    let rows = bench.filter((o) => o.role_family === family);
    if (level) rows = rows.filter((o) => o.seniority_level === level);
    if (region !== 'National') rows = rows.filter((o) => o.region === region);
    if (workModel !== 'all') rows = rows.filter((o) => o.work_model === workModel);
    if (employerType !== 'all') rows = rows.filter((o) => o.employer_type === employerType);
    if (credential !== 'all') rows = rows.filter((o) => o.credential === credential);
    rows = capEmployers(rows);

    const actual = rows.filter((o) => o.observation_type === 'actual').map((o) => o.value);
    const posted = rows.filter((o) => o.observation_type === 'posted').map((o) => o.value);
    const n = actual.length + posted.length;
    if (n < MIN_CELL_N) return null;

    const blended = blendPercentiles(actual, posted);
    const tier = actual.length >= DIRECT_N ? 'direct' : n >= DIRECT_N ? 'blended' : 'modeled';

    // Work-model share among rows with a known model
    const withWm = rows.filter((o) => o.work_model);
    const remoteShare = withWm.length >= MIN_CELL_N ? withWm.filter((o) => o.work_model === 'remote').length / withWm.length : null;

    // Posted-market trend for the family (National only, to keep it robust)
    let medianDelta90: number | null = null;
    let spark: number[] | null = null;
    let demandDelta30: number | null = null;
    if (region === 'National' && !level && workModel === 'all' && employerType === 'all' && credential === 'all') {
      const famPosted = obs.filter((o) => o.role_family === family && o.observation_type === 'posted' && o.in_benchmark);
      const last90 = famPosted.filter((o) => o.period >= monthsBack(asOf, 3)).map((o) => o.value);
      const prev90 = famPosted.filter((o) => o.period >= monthsBack(asOf, 6) && o.period < monthsBack(asOf, 3)).map((o) => o.value);
      if (last90.length >= MIN_CELL_N && prev90.length >= MIN_CELL_N) {
        medianDelta90 = Math.round((median(last90) ?? 0) - (median(prev90) ?? 0));
      }
      const months: number[] = [];
      let prev: number | null = null;
      for (let m = 11; m >= 0; m--) {
        const mStart = monthsBack(asOf, m + 1);
        const mEnd = monthsBack(asOf, m);
        const vals = famPosted.filter((o) => o.period >= mStart && o.period < mEnd).map((o) => o.value);
        const mMed: number | null = vals.length >= 3 ? median(vals) : prev;
        if (mMed !== null) { months.push(Math.round(mMed)); prev = mMed; }
      }
      spark = months.length >= 4 ? months : null;

      const jobsFam = epicJobs.filter((j) => j.classification.family === family && j.posted_date);
      const d30 = jobsFam.filter((j) => j.posted_date! >= monthsBack(asOf, 1)).length;
      const dPrev = jobsFam.filter((j) => j.posted_date! >= monthsBack(asOf, 2) && j.posted_date! < monthsBack(asOf, 1)).length;
      demandDelta30 = d30 - dPrev;
    }

    return {
      role_key: level ? `${family}.${level}` : family,
      role_family: family,
      module: 'all',
      seniority_level: level ?? 'all',
      region,
      work_model: workModel,
      employer_type: employerType,
      credential,
      period,
      n_observations: n,
      n_posted: posted.length,
      n_actual: actual.length,
      ...blended,
      blended_p10: blended.p10, blended_p25: blended.p25, blended_median: blended.p50,
      blended_p75: blended.p75, blended_p90: blended.p90,
      posted_median: posted.length ? Math.round(median(posted)!) : null,
      actual_median: actual.length ? Math.round(median(actual)!) : null,
      remote_share: remoteShare === null ? null : Math.round(remoteShare * 100) / 100,
      demand_count: demandByFamily.get(family) ?? 0,
      confidence_tier: tier,
      median_delta_90d: medianDelta90,
      demand_delta_30d: demandDelta30,
      spark,
    };
  }

  for (const family of families) {
    const levels = [...new Set(bench.filter((o) => o.role_family === family && o.seniority_level).map((o) => o.seniority_level!))];
    for (const region of regions) {
      const all = makeCell({ family, level: null, region, workModel: 'all', employerType: 'all', credential: 'all' });
      if (all) cells.push(all);
      for (const level of levels) {
        const c = makeCell({ family, level, region, workModel: 'all', employerType: 'all', credential: 'all' });
        if (c) cells.push(c);
      }
    }
    for (const wm of ['remote', 'hybrid', 'onsite']) {
      const c = makeCell({ family, level: null, region: 'National', workModel: wm, employerType: 'all', credential: 'all' });
      if (c) cells.push(c);
    }
    const ets = [...new Set(bench.filter((o) => o.role_family === family && o.employer_type).map((o) => o.employer_type!))];
    for (const et of ets) {
      const c = makeCell({ family, level: null, region: 'National', workModel: 'all', employerType: et, credential: 'all' });
      if (c) cells.push(c);
    }
    const creds = [...new Set(bench.filter((o) => o.role_family === family && o.credential).map((o) => o.credential!))];
    for (const cred of creds) {
      const c = makeCell({ family, level: null, region: 'National', workModel: 'all', employerType: 'all', credential: cred });
      if (c) cells.push(c);
    }
  }

  // Monotonicity guard: when a thin/modeled cell prices a rung below the rung
  // beneath it (e.g. Lead paid less than Senior in one region), that's sample
  // noise, not signal — suppress the weak side of the inversion. Two strong
  // cells that invert are left alone: that's the market talking.
  const LEVEL_SERIES = ['L1', 'L2', 'L3', 'L4'];
  const LEADERSHIP_SERIES = ['MGR', 'DIR', 'VP', 'EXEC'];
  const weak = (c: BenchmarkCell) => c.confidence_tier === 'modeled' || c.n_observations < DIRECT_N;
  const baseCut = (c: BenchmarkCell) => c.work_model === 'all' && c.employer_type === 'all' && c.credential === 'all';
  const dropped = new Set<BenchmarkCell>();

  function guardSeries(order: string[], pick: (rank: string) => BenchmarkCell | undefined) {
    for (let pass = 0; pass < order.length; pass++) {
      let changed = false;
      let prev: BenchmarkCell | undefined;
      for (const rank of order) {
        const cell = pick(rank);
        if (!cell || dropped.has(cell)) continue;
        if (prev && cell.blended_median < prev.blended_median) {
          if (weak(cell)) { dropped.add(cell); changed = true; continue; }
          if (weak(prev)) { dropped.add(prev); changed = true; }
        }
        prev = cell;
      }
      if (!changed) break;
    }
  }

  for (const family of families) {
    for (const region of regions) {
      guardSeries(LEVEL_SERIES, (lvl) =>
        cells.find((c) => c.role_family === family && c.seniority_level === lvl && c.region === region && baseCut(c)),
      );
    }
  }
  for (const region of regions) {
    guardSeries(LEADERSHIP_SERIES, (fam) =>
      cells.find((c) => c.role_family === fam && c.seniority_level !== 'all' && c.region === region && baseCut(c)) ??
      cells.find((c) => c.role_family === fam && c.seniority_level === 'all' && c.region === region && baseCut(c)),
    );
  }
  if (dropped.size) {
    console.log(`  monotonicity guard suppressed ${dropped.size} inverted thin cell(s):`);
    for (const c of dropped) console.log(`    - ${c.role_family}/${c.seniority_level}/${c.region} (n=${c.n_observations}, ${c.confidence_tier}, $${c.blended_median})`);
  }
  return cells.filter((c) => !dropped.has(c));
}

// ---------------------------------------------------------------------------
// Sentiment
// ---------------------------------------------------------------------------

type OptionMapper = (raw: Record<string, string>, rec: { work_model: string | null }) => [string, string] | null;

const METRICS: { key: string; label: string; year: 2024 | 2025 | 'both'; map: OptionMapper }[] = [
  {
    key: 'remote_share', label: 'Work location', year: 'both',
    map: (_r, rec) => rec.work_model ? [rec.work_model, { remote: 'Fully remote', hybrid: 'Hybrid', onsite: 'In office' }[rec.work_model]!] : null,
  },
  {
    key: 'rto_response', label: 'If required to return to the office', year: 'both',
    map: (r) => {
      const v = (r.rto_response || '').toLowerCase();
      if (!v) return null;
      if (v.includes('searching') || v === 'yes') return ['look', 'Would look for a new job'];
      if (v.includes('negotiate') || v === 'maybe') return ['negotiate', 'Would negotiate'];
      if (v.includes('comply') || v === 'no') return ['comply', 'Would comply'];
      return null;
    },
  },
  {
    key: 'satisfaction_wlb', label: 'Satisfied with work-life balance', year: 'both',
    map: (r) => {
      const v = (r.sat_wlb || '').toLowerCase();
      if (!v) return null;
      if (v === 'yes' || v === 'very satisfied' || v === 'satisfied') return ['satisfied', 'Satisfied'];
      if (v.includes('somewhat')) return ['somewhat', 'Somewhat satisfied'];
      return ['dissatisfied', 'Not satisfied'];
    },
  },
  {
    key: 'recognized', label: 'Skills recognized by manager/team', year: 2025,
    map: (r) => (r.recognized ? [r.recognized.toLowerCase() === 'yes' ? 'yes' : 'no', r.recognized.toLowerCase() === 'yes' ? 'Recognized' : 'Not recognized'] : null),
  },
  {
    key: 'mobility_role', label: 'Path to the next promotion', year: 'both',
    map: (r) => {
      const v = (r.mobility_role || '').toLowerCase();
      if (!v) return null;
      if (v.startsWith('yes')) return ['clear', 'Clear path up'];
      if (v.includes('person above me')) return ['blocked', 'Blocked, waiting on a seat to open'];
      if (v.startsWith('no')) return ['unclear', 'No clear path'];
      return null;
    },
  },
  {
    key: 'turnover', label: 'Department turnover', year: 'both',
    map: (r) => {
      const v = (r.turnover || '').toLowerCase();
      if (!v) return null;
      if (v.startsWith('low')) return ['low', 'Low'];
      if (v.startsWith('somewhat')) return ['somewhat', 'Somewhat high'];
      if (v.startsWith('high')) return ['high', 'High and disruptive'];
      return null;
    },
  },
  {
    key: 'ma_activity', label: 'M&A in the last 3 years', year: 'both',
    map: (r) => (r.ma ? [r.ma.toLowerCase() === 'yes' ? 'yes' : 'no', r.ma.toLowerCase() === 'yes' ? 'Yes' : 'No'] : null),
  },
  {
    key: 'layoffs', label: 'Layoff / RIF in the last year', year: 'both',
    map: (r) => (r.rif ? [r.rif.toLowerCase() === 'yes' ? 'yes' : 'no', r.rif.toLowerCase() === 'yes' ? 'Yes' : 'No'] : null),
  },
  {
    key: 'fair_comp', label: 'Feel fairly compensated', year: 2025,
    map: (r) => (r.fair_comp ? [r.fair_comp.toLowerCase() === 'yes' ? 'yes' : 'no', r.fair_comp.toLowerCase() === 'yes' ? 'Fairly paid' : 'Underpaid'] : null),
  },
  {
    key: 'job_seeking', label: 'Job-search posture', year: 'both',
    map: (r) => {
      const v = (r.job_seeking || '').toLowerCase();
      if (!v) return null;
      if (v.includes('no plans')) return ['none', 'No plans to move'];
      if (v.includes('passively')) return ['passive', 'Passively exploring'];
      if (v.includes('plan to explore')) return ['planning', 'Planning to explore'];
      if (v.includes('actively')) return ['active', 'Actively applying'];
      return null;
    },
  },
  {
    key: 'ai_impact', label: 'Expected AI impact on role', year: 2025,
    map: (r) => {
      const v = (r.ai_impact || '').toLowerCase();
      if (!v) return null;
      if (v.includes('much of an impact')) return ['no_impact', 'Little to no impact'];
      if (v.includes('enhance')) return ['enhance', 'Will enhance my work'];
      if (v.includes('fundamentally')) return ['transform', 'Will fundamentally change my role'];
      return null;
    },
  },
  {
    key: 'ai_org', label: 'Org has dedicated AI/ML people', year: 2025,
    map: (r) => {
      const v = (r.ai_org || '').toLowerCase();
      if (!v) return null;
      if (v.includes('currently have')) return ['have', 'Already staffed'];
      if (v.includes('do not plan')) return ['no_plan', 'No plans'];
      if (v.includes('plan to hire')) return ['plan', 'Planning to hire'];
      return ['unsure', 'Unsure'];
    },
  },
  {
    key: 'mgr_remote_view', label: 'Managers on remote productivity', year: 2025,
    map: (r) => {
      const v = (r.mgr_remote_view || '').toLowerCase();
      if (!v) return null;
      if (v.includes('more productive')) return ['more', 'More productive'];
      if (v.includes('less')) return ['less', 'Less productive'];
      if (v.includes('productive')) return ['equal', 'Just as productive'];
      return null;
    },
  },
  {
    key: 'ma_stronger', label: 'Stronger position after M&A', year: 2025,
    map: (r) => {
      const v = (r.ma_stronger || '').toLowerCase();
      if (!v) return null;
      if (v === 'yes') return ['yes', 'Stronger'];
      if (v === 'no') return ['no', 'Not stronger'];
      return ['unsure', 'Unsure'];
    },
  },
];

export interface SentimentRow {
  metric_key: string;
  metric_label: string;
  option_key: string;
  option_label: string;
  survey_year: number;
  role_family: string;
  seniority_level: string;
  employer_type: string;
  work_model: string;
  region: string;
  n: number;
  pct: number;
  sort_order: number;
}

export function publishSentiment(surveys: SurveyRecord[]): SentimentRow[] {
  const rows: SentimentRow[] = [];
  const years = [2024, 2025] as const;

  function emit(year: number, cohortFamily: string, cohortWm: string, recs: SurveyRecord[]) {
    for (const metric of METRICS) {
      if (metric.year !== 'both' && metric.year !== year) continue;
      const counts = new Map<string, { label: string; count: number }>();
      let total = 0;
      for (const rec of recs) {
        const mapped = metric.map(rec.raw, rec);
        if (!mapped) continue;
        total++;
        const [key, label] = mapped;
        const e = counts.get(key) ?? { label, count: 0 };
        e.count++;
        counts.set(key, e);
      }
      if (total < MIN_SENTIMENT_N) continue;
      const sorted = [...counts.entries()].sort((a, b) => b[1].count - a[1].count);
      sorted.forEach(([key, { label, count }], i) => {
        rows.push({
          metric_key: metric.key,
          metric_label: metric.label,
          option_key: key,
          option_label: label,
          survey_year: year,
          role_family: cohortFamily,
          seniority_level: 'all',
          employer_type: 'all',
          work_model: cohortWm,
          region: 'all',
          n: total,
          pct: Math.round((count / total) * 1000) / 1000,
          sort_order: i,
        });
      });
    }
  }

  for (const year of years) {
    const wave = surveys.filter((s) => s.survey_year === year);
    emit(year, 'all', 'all', wave);
    for (const family of new Set(wave.map((s) => s.role_family).filter(Boolean) as string[])) {
      emit(year, family, 'all', wave.filter((s) => s.role_family === family));
    }
    for (const wm of ['remote', 'hybrid', 'onsite']) {
      emit(year, 'all', wm, wave.filter((s) => s.work_model === wm));
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Demand, pulse, freshness
// ---------------------------------------------------------------------------

export function publishDemand(jobs: JobRecord[], asOf: Date) {
  const epic = jobs.filter((j) => j.classification.isEpicIt && j.classification.family && !j.is_contractish && j.posted_date);
  const win = epic.filter((j) => j.posted_date! >= monthsBack(asOf, 12));
  const last30 = epic.filter((j) => j.posted_date! >= monthsBack(asOf, 1));
  const prev30 = epic.filter((j) => j.posted_date! >= monthsBack(asOf, 2) && j.posted_date! < monthsBack(asOf, 1));
  const share = (arr: JobRecord[], fam: string) => (arr.length ? arr.filter((j) => j.classification.family === fam).length / arr.length : 0);
  const families = [...new Set(win.map((j) => j.classification.family!))];
  return families
    .map((fam) => ({
      key: fam,
      label: FAMILY_LABEL[fam] ?? fam,
      dimension: 'role_family',
      share: Math.round(share(win, fam) * 1000) / 1000,
      delta_30d: last30.length >= 20 && prev30.length >= 20 ? Math.round((share(last30, fam) - share(prev30, fam)) * 1000) / 1000 : null,
    }))
    .filter((d) => d.share >= 0.01)
    .sort((a, b) => b.share - a.share);
}

export function publishPulse(cells: BenchmarkCell[], jobs: JobRecord[], surveys: SurveyRecord[], asOf: Date) {
  const items: { ts: string; kind: string; text: string; role_key: string | null; delta_value: number | null; delta_unit: string | null }[] = [];
  const iso = (d: number) => new Date(asOf.getTime() - d * 86400000).toISOString();

  const movers = cells
    .filter((c) => c.region === 'National' && c.seniority_level === 'all' && c.work_model === 'all' && c.employer_type === 'all' && c.credential === 'all' && c.median_delta_90d !== null && Math.abs(c.median_delta_90d) >= 1000)
    .sort((a, b) => Math.abs(b.median_delta_90d!) - Math.abs(a.median_delta_90d!))
    .slice(0, 3);
  movers.forEach((c, i) => {
    const dir = c.median_delta_90d! > 0 ? 'up' : 'down';
    items.push({
      ts: iso(2 + i * 3),
      kind: 'benchmark_move',
      text: `${FAMILY_LABEL[c.role_family] ?? c.role_family} posted-market median ${dir} over the last 90 days`,
      role_key: c.role_family,
      delta_value: c.median_delta_90d,
      delta_unit: '$',
    });
  });

  const epic = jobs.filter((j) => j.classification.isEpicIt && j.classification.family && !j.is_contractish && j.posted_date);
  const last30 = epic.filter((j) => j.posted_date! >= new Date(asOf.getTime() - 30 * 86400000).toISOString().slice(0, 10));
  if (last30.length) {
    const remote30 = last30.filter((j) => j.workplace_type === 'remote').length / last30.length;
    items.push({
      ts: iso(1),
      kind: 'new_data',
      text: `${last30.length} new Epic-IT job postings in the last 30 days, ${Math.round(remote30 * 100)}% fully remote`,
      role_key: null,
      delta_value: null,
      delta_unit: null,
    });
  }
  const surveyN = surveys.filter((s) => s.survey_year === 2025).length;
  items.push({
    ts: iso(9),
    kind: 'new_data',
    text: `${surveyN} verified survey responses anchor the current benchmark. The 2026 survey is collecting now`,
    role_key: null,
    delta_value: null,
    delta_unit: null,
  });
  return items;
}

export function publishFreshness(cells: BenchmarkCell[], surveys: SurveyRecord[], jobs: JobRecord[], asOf: Date) {
  const postedDates = jobs.map((j) => j.posted_date).filter(Boolean).sort();
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', " '");
  const windowStart = new Date(Date.UTC(asOf.getUTCFullYear() - 1, asOf.getUTCMonth(), 1));
  return {
    id: 1,
    benchmark_cells: cells.length,
    total_respondents: surveys.length,
    postings_ingested: jobs.length,
    last_survey_ingest: surveys.map((s) => s.submitted_at).sort().at(-1) ?? null,
    last_pulse_refresh: postedDates.at(-1) ? `${postedDates.at(-1)}T00:00:00Z` : null,
    as_of: asOf.toISOString(),
    window_label: `rolling 12 months · ${fmt(windowStart)} – ${fmt(asOf)}`,
  };
}
