import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadJobs } from './seed/load-jobs';
import { loadSurveys } from './seed/load-survey';
import { loadUm } from './seed/load-um';
import { buildObservations } from './seed/publish';

type Row = Record<string, unknown>;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Supabase admin env vars are not configured');

const db = createClient(url, key, { auth: { persistSession: false } });
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'Bloomforce Insights 2.0');

async function upsertRows(
  client: SupabaseClient,
  table: string,
  rows: Row[],
  onConflict: string,
  select: string,
  batchSize = 300,
) {
  const returned: Row[] = [];
  for (let index = 0; index < rows.length; index += batchSize) {
    const { data, error } = await client
      .from(table)
      .upsert(rows.slice(index, index + batchSize), { onConflict })
      .select(select);
    if (error) throw new Error(`${table}: ${error.message}`);
    returned.push(...((data ?? []) as unknown as Row[]));
  }
  return returned;
}

async function main() {
  const startedAt = new Date().toISOString();
  const { data: run, error: runError } = await db
    .from('ingest_runs')
    .insert({ source: 'canonical_backfill', started_at: startedAt, status: 'running' })
    .select('id')
    .single();
  if (runError) throw runError;

  try {
    const surveys = loadSurveys({
      y2024: path.join(dataDir, 'survey-exports/EHR-Salary-Insights-Survey(2026-06-17).csv'),
      y2025: path.join(dataDir, 'survey-exports/2025-EHR-Salary-Insights-Survey(2026-06-17).csv'),
    });
    const jobs = loadJobs(path.join(dataDir, 'apify-exports'));
    const publicRecords = loadUm(
      path.join(dataDir, 'public-salary-exports/um_michigan_medicine_observations_full.csv'),
    );
    const observations = buildObservations(surveys, publicRecords, jobs, new Date());
    const observationBySurvey = new Map(
      observations
        .filter((observation) => observation.source === 'survey' && observation.external_ref)
        .map((observation) => [observation.external_ref!, observation]),
    );

    const surveyRows = surveys.map((survey) => {
      const observation = observationBySurvey.get(survey.external_id);
      return {
        submitted_at: survey.submitted_at,
        role_family: survey.role_family,
        seniority_level: survey.seniority_level,
        role_key: survey.role_key,
        region: survey.region,
        state: survey.state,
        years_experience: survey.years_experience,
        employer_type: survey.employer_type,
        work_model: survey.work_model,
        base_comp: survey.base_comp,
        bonus_comp: survey.bonus_comp,
        total_comp: survey.base_comp !== null ? survey.base_comp + (survey.bonus_comp ?? 0) : null,
        currency: 'USD',
        raw: survey.raw,
        status: 'accepted',
        verified: true,
        source: 'survey',
        survey_year: survey.survey_year,
        credential: survey.credential,
        external_id: survey.external_id,
        instrument_key: `baseline_${survey.survey_year}`,
        instrument_version: 1,
        baseline_cohort: `baseline_${survey.survey_year}`,
        is_baseline: true,
        validation_notes: observation?.quality_flags ?? [],
        accepted_at: survey.submitted_at,
      };
    });
    const persistedSurveys = await upsertRows(
      db,
      'survey_responses',
      surveyRows,
      'external_id',
      'id,external_id',
    );
    const surveyIds = new Map(
      persistedSurveys.map((row) => [String(row.external_id), String(row.id)]),
    );

    const rawJobRows = jobs.map((job) => ({
      source: 'apify_hiringcafe',
      source_job_id: job.source_job_id,
      fingerprint: job.fingerprint,
      job_title: job.job_title,
      company: job.company,
      state: job.state,
      workplace_type: job.workplace_type,
      yearly_min_comp: job.yearly_min_comp,
      yearly_max_comp: job.yearly_max_comp,
      hourly_min_comp: job.hourly_min_comp,
      hourly_max_comp: job.hourly_max_comp,
      currency: 'USD',
      posted_date: job.posted_date,
      job_url: job.job_url,
      is_health_it: job.classification.isEpicIt,
      is_epic: job.classification.isEpicIt,
      raw: job.raw,
      last_seen_at: new Date().toISOString(),
    }));
    const persistedJobs = await upsertRows(
      db,
      'raw_jobs',
      rawJobRows,
      'source,source_job_id',
      'id,source_job_id',
    );
    const jobIds = new Map(
      persistedJobs.map((row) => [String(row.source_job_id), String(row.id)]),
    );

    await upsertRows(
      db,
      'job_classification',
      jobs
        .filter((job) => job.classification.family)
        .map((job) => ({
          raw_job_id: jobIds.get(job.source_job_id),
          is_epic_it_role: job.classification.isEpicIt,
          role_family: job.classification.family,
          seniority_level: job.classification.level,
          role_key: job.classification.level
            ? `${job.classification.family}.${job.classification.level}`
            : job.classification.family,
          module_primary: job.classification.module,
          family_confidence: job.classification.confidence,
          method: 'rules',
          classified_at: new Date().toISOString(),
        })),
      'raw_job_id',
      'id',
    );

    const commonObservation = (observation: (typeof observations)[number]) => ({
      source: observation.source,
      observation_type: observation.observation_type,
      role_family: observation.role_family,
      role_key: observation.role_key,
      seniority_level: observation.seniority_level,
      region: observation.region,
      work_model: observation.work_model,
      employer_type: observation.employer_type,
      credential: observation.credential,
      period: observation.period,
      value: observation.value,
      low: observation.low,
      high: observation.high,
      currency: 'USD',
      in_benchmark: observation.in_benchmark,
      survey_year: observation.survey_year,
      external_ref: observation.external_ref,
      benchmark_cohort: observation.benchmark_cohort,
      measure_type: observation.measure_type,
      quality_flags: observation.quality_flags,
      source_observed_at: `${observation.period}T00:00:00Z`,
    });

    const surveyObservations = observations
      .filter((observation) => observation.source === 'survey' && observation.external_ref)
      .map((observation) => ({
        ...commonObservation(observation),
        survey_response_id: surveyIds.get(observation.external_ref!),
      }));
    await upsertRows(
      db,
      'comp_observations',
      surveyObservations,
      'survey_response_id',
      'id',
    );

    const postedObservations = observations
      .filter((observation) => observation.source === 'apify_hiringcafe' && observation.raw_job_id)
      .map((observation) => ({
        ...commonObservation(observation),
        raw_job_id: jobIds.get(observation.raw_job_id!),
      }));
    await upsertRows(db, 'comp_observations', postedObservations, 'raw_job_id', 'id');

    const publicObservations = observations
      .filter((observation) => observation.source === 'public_record' && observation.external_ref)
      .map(commonObservation);
    await upsertRows(
      db,
      'comp_observations',
      publicObservations,
      'source,external_ref',
      'id',
    );

    const summary = {
      surveys: surveyRows.length,
      jobs: rawJobRows.length,
      classifications: jobs.filter((job) => job.classification.family).length,
      surveyObservations: surveyObservations.length,
      postedObservations: postedObservations.length,
      publicObservations: publicObservations.length,
    };
    await db
      .from('ingest_runs')
      .update({
        finished_at: new Date().toISOString(),
        status: 'ok',
        rows_in: surveyRows.length + rawJobRows.length + observations.length,
        rows_upserted: Object.values(summary).reduce((sum, count) => sum + count, 0),
        rows_accepted: observations.filter((observation) => observation.in_benchmark).length,
        details: summary,
      })
      .eq('id', run.id);
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    await db
      .from('ingest_runs')
      .update({
        finished_at: new Date().toISOString(),
        status: 'error',
        notes: error instanceof Error ? error.message : String(error),
      })
      .eq('id', run.id);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
