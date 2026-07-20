import type { SupabaseClient } from '@supabase/supabase-js';
import { FAMILY_GROUP, type Classification } from '../../../scripts/lib/classify';
import type { JobRecord } from '../../../scripts/seed/load-jobs';
import type { SurveyRecord } from '../../../scripts/seed/load-survey';
import {
  publishBenchmark,
  publishDemand,
  publishFreshness,
  publishPulse,
  type Observation,
} from '../../../scripts/seed/publish';

type Row = Record<string, unknown>;

export interface RefreshSummary {
  observations: number;
  jobs: number;
  surveys: number;
  benchmarkCells: number;
  demandRows: number;
  pulseRows: number;
}

async function allRows(
  db: SupabaseClient,
  table: string,
  columns: string,
  configure?: (query: any) => any,
): Promise<Row[]> {
  const rows: Row[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    let query = db.from(table).select(columns).range(from, from + pageSize - 1);
    if (configure) query = configure(query);
    const { data, error } = await query;
    if (error) throw error;
    const page = (data ?? []) as unknown as Row[];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

function dateOnly(value: unknown): string | null {
  return value ? String(value).slice(0, 10) : null;
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

function isContractish(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const commitment = (raw as Record<string, unknown>).commitment;
  return Array.isArray(commitment) && commitment.some((item) =>
    /contract|temporary|internship|volunteer|seasonal/i.test(String(item)),
  );
}

async function loadCanonicalData(db: SupabaseClient, asOf: Date) {
  const [rawJobs, classifications, observationRows, surveyRows] = await Promise.all([
    allRows(
      db,
      'raw_jobs',
      'id,source_job_id,fingerprint,job_title,company,state,workplace_type,yearly_min_comp,yearly_max_comp,hourly_min_comp,hourly_max_comp,posted_date,job_url,raw',
      (query) => query.is('closed_at', null),
    ),
    allRows(
      db,
      'job_classification',
      'raw_job_id,is_epic_it_role,role_family,module_primary,seniority_level,family_confidence,module_confidence,seniority_confidence',
    ),
    allRows(
      db,
      'comp_observations',
      'id,source,observation_type,role_family,role_key,seniority_level,region,work_model,employer_type,credential,period,value,low,high,in_benchmark,survey_year,external_ref,raw_job_id,benchmark_cohort,measure_type,quality_flags',
    ),
    allRows(
      db,
      'survey_responses',
      'external_id,submitted_at,survey_year,role_family,seniority_level,role_key,region,state,years_experience,employer_type,work_model,base_comp,bonus_comp,credential,raw',
      (query) => query.eq('status', 'accepted'),
    ),
  ]);

  const classByJob = new Map(classifications.map((row) => [String(row.raw_job_id), row]));
  const companyByJob = new Map(rawJobs.map((row) => [String(row.id), stringOrNull(row.company)]));
  const jobs: JobRecord[] = [];
  for (const row of rawJobs) {
    const classified = classByJob.get(String(row.id));
    if (!classified) continue;
    const family = stringOrNull(classified.role_family);
    const level = stringOrNull(classified.seniority_level);
    const classification: Classification & { level: string | null } = {
      isEpicIt: Boolean(classified.is_epic_it_role),
      family,
      group: family ? FAMILY_GROUP[family] ?? null : null,
      level,
      module: stringOrNull(classified.module_primary),
      confidence: numberOrNull(classified.family_confidence) ?? 0,
    };
    jobs.push({
      source_job_id: stringOrNull(row.source_job_id) ?? String(row.id),
      fingerprint: stringOrNull(row.fingerprint) ?? String(row.id),
      job_title: stringOrNull(row.job_title) ?? '',
      company: stringOrNull(row.company),
      state: stringOrNull(row.state),
      region: null,
      workplace_type: stringOrNull(row.workplace_type),
      yearly_min_comp: numberOrNull(row.yearly_min_comp),
      yearly_max_comp: numberOrNull(row.yearly_max_comp),
      hourly_min_comp: numberOrNull(row.hourly_min_comp),
      hourly_max_comp: numberOrNull(row.hourly_max_comp),
      posted_date: dateOnly(row.posted_date),
      job_url: stringOrNull(row.job_url),
      is_contractish: isContractish(row.raw),
      classification,
      raw: row.raw && typeof row.raw === 'object' ? row.raw as Row : {},
    });
  }

  const cutoff = new Date(Date.UTC(asOf.getUTCFullYear() - 1, asOf.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
  const observations: Observation[] = observationRows
    .filter((row) => row.observation_type === 'actual' || row.observation_type === 'posted')
    .map((row): Observation => {
      const observationType = row.observation_type as 'actual' | 'posted';
      const period = dateOnly(row.period) ?? asOf.toISOString().slice(0, 7) + '-01';
      return {
        id: String(row.id),
        source: String(row.source),
        observation_type: observationType,
        role_family: String(row.role_family),
        role_key: String(row.role_key),
        seniority_level: stringOrNull(row.seniority_level),
        region: stringOrNull(row.region),
        work_model: stringOrNull(row.work_model),
        employer_type: stringOrNull(row.employer_type),
        credential: stringOrNull(row.credential),
        period,
        value: Number(row.value),
        low: numberOrNull(row.low),
        high: numberOrNull(row.high),
        in_benchmark: Boolean(row.in_benchmark) && (observationType === 'actual' || period >= cutoff),
        survey_year: numberOrNull(row.survey_year),
        external_ref: stringOrNull(row.external_ref),
        raw_job_id: stringOrNull(row.raw_job_id),
        company: row.raw_job_id ? companyByJob.get(String(row.raw_job_id)) ?? null : null,
        benchmark_cohort: stringOrNull(row.benchmark_cohort) ?? 'legacy',
        measure_type: row.measure_type === 'posted_range_midpoint'
          ? 'posted_range_midpoint'
          : 'base_salary',
        quality_flags: Array.isArray(row.quality_flags) ? row.quality_flags.map(String) : [],
      };
    })
    .filter((row) => row.role_family && row.role_key && Number.isFinite(row.value));

  const surveys: SurveyRecord[] = surveyRows.map((row) => ({
    external_id: stringOrNull(row.external_id) ?? crypto.randomUUID(),
    submitted_at: String(row.submitted_at),
    survey_year: Number(row.survey_year),
    role_family: stringOrNull(row.role_family),
    seniority_level: stringOrNull(row.seniority_level),
    role_key: stringOrNull(row.role_key),
    region: stringOrNull(row.region),
    state: stringOrNull(row.state),
    years_experience: numberOrNull(row.years_experience),
    employer_type: stringOrNull(row.employer_type) ?? 'other',
    work_model: stringOrNull(row.work_model),
    base_comp: numberOrNull(row.base_comp),
    bonus_comp: numberOrNull(row.bonus_comp),
    credential: stringOrNull(row.credential),
    raw: row.raw && typeof row.raw === 'object'
      ? Object.fromEntries(Object.entries(row.raw as Row).map(([key, value]) => [key, String(value ?? '')]))
      : {},
  }));

  return { jobs, observations, surveys };
}

async function upsertBatches(
  db: SupabaseClient,
  table: string,
  rows: Row[],
  onConflict?: string,
) {
  for (let index = 0; index < rows.length; index += 500) {
    const { error } = await db.from(table).upsert(rows.slice(index, index + 500), {
      onConflict,
    });
    if (error) throw error;
  }
}

export async function refreshPublishedMarketData(
  db: SupabaseClient,
  asOf = new Date(),
): Promise<RefreshSummary> {
  const startedAt = new Date().toISOString();
  const { data: run } = await db
    .from('ingest_runs')
    .insert({ source: 'market_refresh', started_at: startedAt, status: 'running' })
    .select('id')
    .single();

  try {
    const { jobs, observations, surveys } = await loadCanonicalData(db, asOf);
    const cells = publishBenchmark(observations, jobs, asOf);
    const demand = publishDemand(jobs, asOf);
    const pulse = publishPulse(cells, jobs, surveys, asOf);
    const freshness = publishFreshness(cells, surveys, jobs, asOf);
    const updatedAt = new Date().toISOString();

    await upsertBatches(
      db,
      'benchmark_published',
      cells.map((cell) => ({ ...cell, updated_at: updatedAt })),
      'role_key,region,work_model,employer_type,credential,period',
    );
    const { error: staleBenchmarkError } = await db
      .from('benchmark_published')
      .delete()
      .lt('updated_at', updatedAt);
    if (staleBenchmarkError) throw staleBenchmarkError;

    await upsertBatches(
      db,
      'demand_published',
      demand.map((row) => ({ ...row, updated_at: updatedAt })),
      'key',
    );
    const { error: staleDemandError } = await db
      .from('demand_published')
      .delete()
      .lt('updated_at', updatedAt);
    if (staleDemandError) throw staleDemandError;

    const { error: deactivateError } = await db
      .from('pulse_published')
      .update({ active: false })
      .eq('active', true);
    if (deactivateError) throw deactivateError;
    if (pulse.length) {
      const { error: pulseError } = await db
        .from('pulse_published')
        .insert(pulse.map((row) => ({ ...row, active: true })));
      if (pulseError) throw pulseError;
    }

    const { error: freshnessError } = await db
      .from('freshness_published')
      .upsert(freshness, { onConflict: 'id' });
    if (freshnessError) throw freshnessError;

    const summary: RefreshSummary = {
      observations: observations.length,
      jobs: jobs.length,
      surveys: surveys.length,
      benchmarkCells: cells.length,
      demandRows: demand.length,
      pulseRows: pulse.length,
    };
    if (run?.id) {
      await db
        .from('ingest_runs')
        .update({
          finished_at: new Date().toISOString(),
          status: 'ok',
          rows_in: observations.length + jobs.length + surveys.length,
          rows_upserted: cells.length + demand.length + pulse.length + 1,
          rows_accepted: cells.length,
          details: summary,
        })
        .eq('id', run.id);
    }
    return summary;
  } catch (error) {
    if (run?.id) {
      await db
        .from('ingest_runs')
        .update({
          finished_at: new Date().toISOString(),
          status: 'error',
          notes: error instanceof Error ? error.message : String(error),
        })
        .eq('id', run.id);
    }
    throw error;
  }
}
