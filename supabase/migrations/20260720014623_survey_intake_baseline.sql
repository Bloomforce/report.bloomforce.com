-- Permanent survey baseline + governed continuous survey intake.
-- Raw submissions and review data are service-role only. Public access remains
-- limited to the existing aggregated *_published surfaces.

create table if not exists public.survey_instruments (
  key text primary key,
  provider text not null,
  provider_form_id text,
  audience text not null,
  version int not null default 1,
  is_full_survey boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_form_id)
);

insert into public.survey_instruments
  (key, provider, provider_form_id, audience, version, is_full_survey)
values
  ('2026_health_system_fte', 'jotform', '261236096913156', 'health_system_fte', 1, true),
  ('2026_health_system_leader', 'jotform', '261235120925146', 'health_system_leader', 1, true),
  ('2026_consultant_contractor', 'jotform', '261212814610142', 'consultant_contractor', 1, true),
  ('2026_application_managed_services', 'jotform', '261235387748164', 'application_managed_services', 1, true),
  ('2026_other_healthcare_it', 'jotform', '261235392416152', 'other_healthcare_it', 1, true),
  ('continuous_comp_contribution', 'bloomforce', 'report-contribution', 'all', 1, false)
on conflict (key) do update set
  provider_form_id = excluded.provider_form_id,
  audience = excluded.audience,
  version = excluded.version,
  is_full_survey = excluded.is_full_survey,
  active = true,
  updated_at = now();

create table if not exists public.survey_submissions_raw (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_form_id text not null,
  provider_submission_id text not null,
  instrument_key text references public.survey_instruments(key),
  instrument_version int not null default 1,
  submitted_at timestamptz,
  received_at timestamptz not null default now(),
  payload jsonb not null,
  payload_sha256 text,
  processing_status text not null default 'received'
    check (processing_status in ('received','normalized','accepted','review_required','rejected','error')),
  processing_error text,
  processed_at timestamptz,
  unique (provider, provider_submission_id)
);
create index if not exists survey_submissions_raw_status_idx
  on public.survey_submissions_raw (processing_status, received_at);
create index if not exists survey_submissions_raw_instrument_idx
  on public.survey_submissions_raw (instrument_key, received_at);

create table if not exists public.survey_question_map (
  id uuid primary key default gen_random_uuid(),
  instrument_key text not null references public.survey_instruments(key) on delete cascade,
  instrument_version int not null,
  provider_field text not null,
  canonical_field text not null,
  transform text not null default 'text',
  required boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (instrument_key, instrument_version, provider_field)
);

insert into public.survey_question_map
  (instrument_key, instrument_version, provider_field, canonical_field, transform, required)
select instrument.key, 1, mapping.provider_field, mapping.canonical_field,
       mapping.transform, mapping.required
from public.survey_instruments instrument
cross join (values
  ('q9',   'job_title',        'text',          true),
  ('q260', 'years_experience', 'years_midpoint', false),
  ('q8',   'employer_type',    'employer_type', false),
  ('q305', 'employer_type',    'employer_type', false),
  ('q12',  'work_model',       'work_model',    false),
  ('q13',  'employer_state',   'state_region',  false),
  ('q292', 'ehr',              'text',          false),
  ('q266', 'base_comp',        'annual_comp',   true),
  ('q267', 'bonus_comp',       'money',         false)
) as mapping(provider_field, canonical_field, transform, required)
where instrument.provider = 'jotform'
on conflict (instrument_key, instrument_version, provider_field) do update set
  canonical_field = excluded.canonical_field,
  transform = excluded.transform,
  required = excluded.required,
  active = true,
  updated_at = now();

alter table public.survey_responses
  add column if not exists instrument_key text references public.survey_instruments(key),
  add column if not exists instrument_version int,
  add column if not exists provider_submission_id text,
  add column if not exists raw_submission_id uuid references public.survey_submissions_raw(id) on delete set null,
  add column if not exists respondent_key text,
  add column if not exists baseline_cohort text,
  add column if not exists is_baseline boolean not null default false,
  add column if not exists rejection_reason text,
  add column if not exists validation_notes jsonb not null default '[]'::jsonb,
  add column if not exists accepted_at timestamptz,
  add column if not exists reviewed_at timestamptz;

insert into public.survey_instruments
  (key, provider, provider_form_id, audience, version, is_full_survey, active)
values
  ('baseline_2024', 'csv', 'baseline-2024', 'historical', 1, true, true),
  ('baseline_2025', 'csv', 'baseline-2025', 'historical', 1, true, true)
on conflict (key) do nothing;

update public.survey_responses
set is_baseline = true,
    baseline_cohort = 'baseline_' || survey_year::text,
    instrument_key = coalesce(instrument_key, 'baseline_' || survey_year::text),
    accepted_at = coalesce(accepted_at, submitted_at),
    verified = true,
    status = 'accepted'
where source = 'survey' and survey_year in (2024, 2025);

create unique index if not exists survey_responses_provider_submission_key
  on public.survey_responses (instrument_key, provider_submission_id)
  where provider_submission_id is not null;
create index if not exists survey_responses_review_idx
  on public.survey_responses (status, submitted_at);
create index if not exists survey_responses_baseline_idx
  on public.survey_responses (is_baseline, survey_year);
create index if not exists survey_responses_respondent_idx
  on public.survey_responses (respondent_key, submitted_at)
  where respondent_key is not null;

alter table public.comp_observations
  add column if not exists benchmark_cohort text,
  add column if not exists measure_type text not null default 'base_salary',
  add column if not exists quality_flags jsonb not null default '[]'::jsonb,
  add column if not exists source_observed_at timestamptz;

update public.comp_observations
set benchmark_cohort = 'baseline_' || survey_year::text,
    measure_type = 'base_salary'
where source = 'survey' and survey_year in (2024, 2025);

update public.comp_observations
set measure_type = 'posted_range_midpoint'
where observation_type = 'posted';

-- Preserve every historical response, but exclude only major 3x-IQR salary
-- anomalies from the permanent baseline. These remain available for review.
with family_bounds as (
  select role_family,
         count(*) as n,
         percentile_cont(0.25) within group (order by value) as q1,
         percentile_cont(0.75) within group (order by value) as q3
  from public.comp_observations
  where source = 'survey'
    and survey_year in (2024, 2025)
    and observation_type = 'actual'
    and value is not null
  group by role_family
), major_outliers as (
  select observation.id
  from public.comp_observations observation
  join family_bounds bounds using (role_family)
  where bounds.n >= 8
    and (
      observation.value < bounds.q1 - 3 * (bounds.q3 - bounds.q1)
      or observation.value > bounds.q3 + 3 * (bounds.q3 - bounds.q1)
    )
    and observation.source = 'survey'
    and observation.survey_year in (2024, 2025)
)
update public.comp_observations observation
set in_benchmark = false,
    quality_flags = coalesce(observation.quality_flags, '[]'::jsonb) || '["major_outlier_3iqr"]'::jsonb
from major_outliers
where observation.id = major_outliers.id;

create unique index if not exists comp_observations_survey_response_key
  on public.comp_observations (survey_response_id)
  where survey_response_id is not null;
create index if not exists comp_observations_cohort_idx
  on public.comp_observations (benchmark_cohort, in_benchmark);

create table if not exists public.ingest_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  rows_in int,
  rows_upserted int,
  notes text
);
alter table public.ingest_runs
  add column if not exists rows_accepted int,
  add column if not exists rows_review_required int,
  add column if not exists rows_rejected int,
  add column if not exists details jsonb not null default '{}'::jsonb;
create index if not exists ingest_runs_source_started_idx
  on public.ingest_runs (source, started_at desc);

-- Current benchmark cuts use more dimensions than the original v1 key.
alter table public.benchmark_published
  drop constraint if exists benchmark_published_role_key_region_period_key;
create unique index if not exists benchmark_published_cut_key
  on public.benchmark_published
    (role_key, region, work_model, employer_type, credential, period);

alter table public.survey_instruments enable row level security;
alter table public.survey_submissions_raw enable row level security;
alter table public.survey_question_map enable row level security;
alter table public.ingest_runs enable row level security;

revoke all on public.survey_instruments from anon, authenticated;
revoke all on public.survey_submissions_raw from anon, authenticated;
revoke all on public.survey_question_map from anon, authenticated;
revoke all on public.survey_responses from anon, authenticated;
revoke all on public.comp_observations from anon, authenticated;
revoke all on public.ingest_runs from anon, authenticated;
