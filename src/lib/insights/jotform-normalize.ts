import type { SupabaseClient } from '@supabase/supabase-js';
import { classifyTitle, roleKey } from '../../../scripts/lib/classify';
import {
  normalizeEmployerType,
  normalizeWorkModel,
  parseAnnualComp,
  parseMoney,
  stateToCode,
  stateToRegion,
  yearsBandMidpoint,
} from '../../../scripts/lib/normalize';
import { normalizedRespondentKey } from './survey-quality';
import type { SurveyInstrument } from './survey-instruments';

type Payload = Record<string, unknown>;

export interface NormalizationResult {
  responseId: string | null;
  status: 'normalized' | 'review_required';
  reasons: string[];
}

function scalar(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    const values = value.map(scalar).filter(Boolean);
    return values.length ? values.join('; ') : null;
  }
  if (value && typeof value === 'object') {
    const values = Object.values(value as Record<string, unknown>)
      .map(scalar)
      .filter(Boolean);
    return values.length ? values.join(' ') : null;
  }
  return null;
}

function answer(payload: Payload, questionId: number): string | null {
  const matcher = new RegExp(`^q${questionId}(?:_|$)`, 'i');
  for (const [key, value] of Object.entries(payload)) {
    if (matcher.test(key)) return scalar(value);
  }
  return null;
}

function emailAnswer(payload: Payload): string | null {
  for (const [key, value] of Object.entries(payload)) {
    if (!/email/i.test(key)) continue;
    const candidate = scalar(value);
    if (candidate && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) return candidate;
  }
  return null;
}

function levelFromYears(years: number | null): string | null {
  if (years === null) return null;
  if (years < 3) return 'L1';
  if (years < 7) return 'L2';
  if (years < 12) return 'L3';
  return 'L4';
}

function piiFreeAnswers(payload: Payload): Record<string, string | number | null> {
  return {
    title: answer(payload, 9),
    years_experience: yearsBandMidpoint(answer(payload, 260)),
    employer_type: answer(payload, 8) ?? answer(payload, 305),
    work_model: answer(payload, 12),
    employer_state: answer(payload, 13),
    ehr: answer(payload, 292),
    base_comp: parseAnnualComp(answer(payload, 266)),
    bonus_comp: parseMoney(answer(payload, 267)),
  };
}

export async function normalizeJotformSubmission(
  db: SupabaseClient,
  rawSubmissionId: string,
  payload: Payload,
  instrument: SurveyInstrument,
  submissionId: string,
  submittedAt: string,
): Promise<NormalizationResult> {
  const answers = piiFreeAnswers(payload);
  const title = typeof answers.title === 'string' ? answers.title : '';
  const ehr = typeof answers.ehr === 'string' ? answers.ehr : '';
  const years = typeof answers.years_experience === 'number' ? answers.years_experience : null;
  const classification = classifyTitle(title, ehr);
  const level = classification.level ?? levelFromYears(years);
  const baseComp = typeof answers.base_comp === 'number' ? answers.base_comp : null;
  const bonusComp = typeof answers.bonus_comp === 'number' ? answers.bonus_comp : null;
  const stateRaw = typeof answers.employer_state === 'string' ? answers.employer_state : null;
  const reasons: string[] = [];

  if (!title) reasons.push('missing_job_title');
  if (!classification.family) reasons.push('unclassified_job_title');
  if (!level) reasons.push('missing_seniority');
  if (baseComp === null) reasons.push('missing_base_salary');

  const email = emailAnswer(payload);
  const respondentKey = email ? await normalizedRespondentKey(email) : null;
  const normalizedStatus = reasons.length ? 'review_required' : 'normalized';
  const surveyStatus = reasons.length ? 'review_required' : 'pending';
  const family = classification.family;

  const { data: response, error: responseError } = await db
    .from('survey_responses')
    .insert({
      submitted_at: submittedAt,
      role_family: family,
      module: classification.module,
      seniority_level: level,
      role_key: family && level ? roleKey(family, level) : family,
      region: stateToRegion(stateRaw),
      state: stateToCode(stateRaw),
      years_experience: years,
      employer_type: normalizeEmployerType(
        typeof answers.employer_type === 'string' ? answers.employer_type : instrument.audience,
      ),
      work_model: normalizeWorkModel(
        typeof answers.work_model === 'string' ? answers.work_model : null,
      ),
      base_comp: baseComp,
      bonus_comp: bonusComp,
      total_comp: baseComp === null ? null : baseComp + (bonusComp ?? 0),
      currency: 'USD',
      raw: { audience: instrument.audience, answers },
      status: surveyStatus,
      verified: false,
      source: 'jotform',
      survey_year: new Date(submittedAt).getUTCFullYear(),
      external_id: `jotform:${submissionId}`,
      instrument_key: instrument.key,
      instrument_version: instrument.version,
      provider_submission_id: submissionId,
      raw_submission_id: rawSubmissionId,
      respondent_key: respondentKey,
      baseline_cohort: 'continuous',
      is_baseline: false,
      validation_notes: reasons,
    })
    .select('id')
    .single();
  if (responseError) throw responseError;

  const { error: rawError } = await db
    .from('survey_submissions_raw')
    .update({
      processing_status: normalizedStatus,
      processing_error: reasons.length ? reasons.join(';') : null,
      processed_at: new Date().toISOString(),
    })
    .eq('id', rawSubmissionId);
  if (rawError) throw rawError;

  return { responseId: response?.id ?? null, status: normalizedStatus, reasons };
}
