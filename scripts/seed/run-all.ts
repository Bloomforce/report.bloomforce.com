import path from 'node:path';
import { loadSurveys } from './load-survey';
import { loadUm } from './load-um';
import { loadJobs } from './load-jobs';
import {
  buildObservations,
  publishBenchmark,
  publishDemand,
  publishFreshness,
  publishPulse,
  publishSentiment,
} from './publish';
import { SqlFileSink, SupabaseSink, type Sink } from '../lib/sink';

const ROOT = path.resolve(__dirname, '../..');
const DATA = path.join(ROOT, 'Bloomforce Insights 2.0');

async function main() {
  const asOf = new Date();
  const outDir = process.env.SEED_SQL_DIR ?? path.join(ROOT, 'scripts/seed/out');
  const sink: Sink =
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? new SupabaseSink(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
      : new SqlFileSink(outDir);

  console.log('— loading sources');
  const surveys = loadSurveys({
    y2024: path.join(DATA, 'survey-exports/EHR-Salary-Insights-Survey(2026-06-17).csv'),
    y2025: path.join(DATA, 'survey-exports/2025-EHR-Salary-Insights-Survey(2026-06-17).csv'),
  });
  const um = loadUm(path.join(DATA, 'public-salary-exports/um_michigan_medicine_observations_full.csv'));
  const jobs = loadJobs(path.join(DATA, 'apify-exports'));

  const epicJobs = jobs.filter((j) => j.classification.isEpicIt && j.classification.family);
  console.log(`surveys=${surveys.length} (2024=${surveys.filter((s) => s.survey_year === 2024).length}, 2025=${surveys.filter((s) => s.survey_year === 2025).length})`);
  console.log(`um=${um.length} jobs=${jobs.length} epicClassified=${epicJobs.length}`);

  console.log('— building observations');
  const obs = buildObservations(surveys, um, jobs, asOf);
  const posted = obs.filter((o) => o.observation_type === 'posted');
  console.log(`observations=${obs.length} (actual=${obs.length - posted.length}, posted=${posted.length}, in_benchmark=${obs.filter((o) => o.in_benchmark).length})`);

  console.log('— publishing');
  const cells = publishBenchmark(obs, jobs, asOf);
  const sentiment = publishSentiment(surveys);
  const demand = publishDemand(jobs, asOf);
  const pulse = publishPulse(cells, jobs, surveys, asOf);
  const freshness = publishFreshness(cells, surveys, jobs, asOf);
  console.log(`benchmark_cells=${cells.length} sentiment_rows=${sentiment.length} demand=${demand.length} pulse=${pulse.length}`);

  // ---- emit --------------------------------------------------------------
  await sink.raw(
    `delete from public.comp_observations where source in ('survey','public_record','apify_hiringcafe');
delete from public.survey_responses where source = 'survey';
delete from public.job_classification;
delete from public.raw_jobs where source = 'apify_hiringcafe';
delete from public.benchmark_published;
delete from public.sentiment_published;
delete from public.pulse_published;
delete from public.demand_published;
delete from public.freshness_published;`,
    'cleanup',
  );

  const surveyIds = new Map<string, string>();
  await sink.insert(
    'public.survey_responses',
    surveys.map((s) => {
      const id = crypto.randomUUID();
      surveyIds.set(s.external_id, id);
      return {
        id,
        submitted_at: s.submitted_at,
        role_family: s.role_family,
        seniority_level: s.seniority_level,
        role_key: s.role_key,
        region: s.region,
        state: s.state,
        years_experience: s.years_experience,
        employer_type: s.employer_type,
        work_model: s.work_model,
        base_comp: s.base_comp,
        bonus_comp: s.bonus_comp,
        total_comp: s.base_comp !== null ? s.base_comp + (s.bonus_comp ?? 0) : null,
        currency: 'USD',
        raw: s.raw,
        status: 'accepted',
        verified: true,
        source: 'survey',
        survey_year: s.survey_year,
        credential: s.credential,
        external_id: s.external_id,
      };
    }),
    60,
  );

  const jobIds = new Map<string, string>();
  await sink.insert(
    'public.raw_jobs',
    jobs.map((j) => {
      const id = crypto.randomUUID();
      jobIds.set(j.source_job_id, id);
      return {
        id,
        source: 'apify_hiringcafe',
        source_job_id: j.source_job_id,
        fingerprint: j.fingerprint,
        job_title: j.job_title,
        company: j.company,
        state: j.state,
        workplace_type: j.workplace_type,
        yearly_min_comp: j.yearly_min_comp,
        yearly_max_comp: j.yearly_max_comp,
        hourly_min_comp: j.hourly_min_comp,
        hourly_max_comp: j.hourly_max_comp,
        currency: 'USD',
        posted_date: j.posted_date,
        job_url: j.job_url,
        is_health_it: j.classification.isEpicIt,
        is_epic: j.classification.isEpicIt,
        raw: j.raw,
      };
    }),
    150,
  );

  await sink.insert(
    'public.job_classification',
    jobs
      .filter((j) => j.classification.family)
      .map((j) => ({
        raw_job_id: jobIds.get(j.source_job_id),
        is_epic_it_role: j.classification.isEpicIt,
        role_family: j.classification.family,
        seniority_level: j.classification.level,
        role_key: j.classification.level ? `${j.classification.family}.${j.classification.level}` : j.classification.family,
        module_primary: j.classification.module,
        family_confidence: j.classification.confidence,
        method: 'rules',
      })),
    200,
  );

  await sink.insert(
    'public.comp_observations',
    obs.map((o) => ({
      id: o.id,
      source: o.source,
      observation_type: o.observation_type,
      role_family: o.role_family,
      role_key: o.role_key,
      seniority_level: o.seniority_level,
      region: o.region,
      work_model: o.work_model,
      employer_type: o.employer_type,
      credential: o.credential,
      period: o.period,
      value: o.value,
      low: o.low,
      high: o.high,
      currency: 'USD',
      in_benchmark: o.in_benchmark,
      survey_year: o.survey_year,
      external_ref: o.external_ref,
      raw_job_id: o.raw_job_id ? jobIds.get(o.raw_job_id) ?? null : null,
      survey_response_id: o.external_ref && o.source === 'survey' ? surveyIds.get(o.external_ref) ?? null : null,
    })),
    150,
  );

  await sink.insert('public.benchmark_published', cells.map((c) => ({ ...c, spark: c.spark ?? null, updated_at: asOf.toISOString() })), 60);
  await sink.insert('public.sentiment_published', sentiment as unknown as Record<string, unknown>[], 150);
  await sink.insert('public.pulse_published', pulse, 100);
  await sink.insert('public.demand_published', demand, 100);
  await sink.insert('public.freshness_published', [freshness], 10);
  await sink.flush();

  if (sink instanceof SqlFileSink) {
    console.log(`\nSQL written to ${outDir} — apply files in order via the Supabase SQL editor or MCP.`);
  } else {
    console.log('\nApplied directly via service role.');
  }

  // quick verification summary
  const aaNational = cells.find((c) => c.role_key === 'AA' && c.region === 'National' && c.work_model === 'all' && c.employer_type === 'all' && c.credential === 'all');
  console.log('\nAnchor check — AA National:', aaNational ? `blended median $${aaNational.blended_median.toLocaleString()} (nA=${aaNational.n_actual}, nP=${aaNational.n_posted}, posted $${aaNational.posted_median?.toLocaleString()}, actual $${aaNational.actual_median?.toLocaleString()})` : 'MISSING — investigate');
  const under = cells.filter((c) => c.n_observations < 5);
  console.log(`cells under N=5: ${under.length} (must be 0)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
