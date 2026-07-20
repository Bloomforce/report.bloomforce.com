import type { SupabaseClient } from '@supabase/supabase-js';
import { evaluateSalary } from './survey-quality';

export interface PromotionSummary {
  seen: number;
  accepted: number;
  reviewRequired: number;
  rejected: number;
  alreadyPromoted: number;
}

type SurveyRow = Record<string, unknown> & {
  id: string;
  submitted_at: string;
  role_family: string | null;
  module: string | null;
  role_key: string | null;
  seniority_level: string | null;
  region: string | null;
  work_model: string | null;
  employer_type: string | null;
  credential: string | null;
  base_comp: number | string | null;
  survey_year: number | null;
  source: string;
  respondent_key: string | null;
  instrument_key: string | null;
  provider_submission_id: string | null;
  raw_submission_id: string | null;
};

function monthStart(value: string): string {
  return `${value.slice(0, 7)}-01`;
}

export async function promotePendingSurveyResponses(
  db: SupabaseClient,
): Promise<PromotionSummary> {
  const runStarted = new Date().toISOString();
  const { data: run } = await db
    .from('ingest_runs')
    .insert({ source: 'survey_promotion', started_at: runStarted, status: 'running' })
    .select('id')
    .single();

  const summary: PromotionSummary = {
    seen: 0,
    accepted: 0,
    reviewRequired: 0,
    rejected: 0,
    alreadyPromoted: 0,
  };

  try {
    const { data: pending, error } = await db
      .from('survey_responses')
      .select('*')
      .in('source', ['web_contribution', 'jotform'])
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true });
    if (error) throw error;
    const rows = (pending ?? []) as SurveyRow[];
    summary.seen = rows.length;

    const { data: acceptedObservations, error: acceptedError } = await db
      .from('comp_observations')
      .select('role_family,value,survey_response_id')
      .eq('observation_type', 'actual')
      .eq('measure_type', 'base_salary')
      .eq('in_benchmark', true);
    if (acceptedError) throw acceptedError;

    const familyValues = new Map<string, number[]>();
    const promotedIds = new Set<string>();
    for (const observation of acceptedObservations ?? []) {
      if (observation.survey_response_id) promotedIds.add(String(observation.survey_response_id));
      const family = String(observation.role_family ?? '');
      const value = Number(observation.value);
      if (!family || !Number.isFinite(value)) continue;
      if (!familyValues.has(family)) familyValues.set(family, []);
      familyValues.get(family)!.push(value);
    }

    const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const { data: recentAccepted, error: recentError } = await db
      .from('survey_responses')
      .select('id,respondent_key,role_key,base_comp,submitted_at')
      .in('source', ['web_contribution', 'jotform'])
      .eq('status', 'accepted')
      .gte('submitted_at', cutoff);
    if (recentError) throw recentError;

    for (const row of rows) {
      if (promotedIds.has(row.id)) {
        await db.from('survey_responses').update({ status: 'accepted' }).eq('id', row.id);
        if (row.raw_submission_id) {
          await db
            .from('survey_submissions_raw')
            .update({ processing_status: 'accepted', processed_at: new Date().toISOString() })
            .eq('id', row.raw_submission_id);
        }
        summary.alreadyPromoted++;
        continue;
      }

      const family = row.role_family ?? '';
      const base = Number(row.base_comp);
      const reasons: string[] = [];
      // Region is intentionally optional. Responses without a reliable state
      // still strengthen the National cut without polluting a regional cut.
      if (!family || !row.role_key || !row.seniority_level || !row.employer_type) {
        reasons.push('missing_required_benchmark_fields');
      }

      const duplicate = Boolean(
        row.respondent_key &&
          (recentAccepted ?? []).some(
            (candidate) =>
              candidate.id !== row.id &&
              candidate.respondent_key === row.respondent_key &&
              candidate.role_key === row.role_key &&
              Number(candidate.base_comp) === base,
          ),
      );
      if (duplicate) reasons.push('duplicate_response_within_30_days');

      const quality = evaluateSalary(family, base, familyValues.get(family) ?? []);
      reasons.push(...quality.reasons);

      if (duplicate || reasons.includes('missing_required_benchmark_fields') || quality.disposition === 'reject') {
        await db
          .from('survey_responses')
          .update({
            status: 'rejected',
            rejection_reason: reasons.join(';'),
            validation_notes: reasons,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', row.id);
        if (row.raw_submission_id) {
          await db
            .from('survey_submissions_raw')
            .update({
              processing_status: 'rejected',
              processing_error: reasons.join(';'),
              processed_at: new Date().toISOString(),
            })
            .eq('id', row.raw_submission_id);
        }
        summary.rejected++;
        continue;
      }

      if (quality.disposition === 'review') {
        await db
          .from('survey_responses')
          .update({ status: 'review_required', validation_notes: reasons })
          .eq('id', row.id);
        if (row.raw_submission_id) {
          await db
            .from('survey_submissions_raw')
            .update({
              processing_status: 'review_required',
              processing_error: reasons.join(';'),
              processed_at: new Date().toISOString(),
            })
            .eq('id', row.raw_submission_id);
        }
        summary.reviewRequired++;
        continue;
      }

      const acceptedAt = new Date().toISOString();
      const { error: observationError } = await db.from('comp_observations').insert({
        source: row.source,
        observation_type: 'actual',
        role_family: family,
        role_key: row.role_key,
        module: row.module,
        seniority_level: row.seniority_level,
        region: row.region,
        work_model: row.work_model,
        employer_type: row.employer_type,
        credential: row.credential,
        period: monthStart(row.submitted_at),
        value: base,
        currency: 'USD',
        in_benchmark: true,
        survey_year: row.survey_year,
        survey_response_id: row.id,
        external_ref: row.provider_submission_id
          ? `${row.instrument_key ?? row.source}:${row.provider_submission_id}`
          : `${row.source}:${row.id}`,
        benchmark_cohort: 'continuous',
        measure_type: 'base_salary',
        quality_flags: [],
        source_observed_at: row.submitted_at,
      });
      if (observationError) throw observationError;

      await db
        .from('survey_responses')
        .update({
          status: 'accepted',
          verified: true,
          accepted_at: acceptedAt,
          rejection_reason: null,
          validation_notes: [],
        })
        .eq('id', row.id);
      if (row.raw_submission_id) {
        await db
          .from('survey_submissions_raw')
          .update({ processing_status: 'accepted', processed_at: acceptedAt })
          .eq('id', row.raw_submission_id);
      }
      familyValues.get(family)?.push(base);
      if (!familyValues.has(family)) familyValues.set(family, [base]);
      summary.accepted++;
    }

    if (run?.id) {
      await db
        .from('ingest_runs')
        .update({
          finished_at: new Date().toISOString(),
          status: 'ok',
          rows_in: summary.seen,
          rows_upserted: summary.accepted,
          rows_accepted: summary.accepted,
          rows_review_required: summary.reviewRequired,
          rows_rejected: summary.rejected,
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
          details: summary,
        })
        .eq('id', run.id);
    }
    throw error;
  }
}
