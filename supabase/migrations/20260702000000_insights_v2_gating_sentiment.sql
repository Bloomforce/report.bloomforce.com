-- Bloomforce Insights 2.0 — gating, blend, sentiment, pulse delta migration
-- Target: Workforce Data project (qcmodgkcwxoilajuouue)
-- Additive only; the anon policy on benchmark_published is dropped at cutover
-- (phase 6), after the site reads the *_public views.

-- 1) Blend + trend columns on the published benchmark
alter table public.benchmark_published
  add column if not exists blended_p10 numeric,
  add column if not exists blended_p25 numeric,
  add column if not exists blended_median numeric,
  add column if not exists blended_p75 numeric,
  add column if not exists blended_p90 numeric,
  add column if not exists credential text not null default 'all',
  add column if not exists median_delta_90d numeric,
  add column if not exists demand_delta_30d numeric,
  add column if not exists spark jsonb;   -- <=12 monthly blended medians, oldest first

-- 2) Public view: the blend is THE number. No posted/actual split, no
--    n_posted/n_actual, no demand counts. n_observations stays (honesty).
create or replace view public.benchmark_public as
  select role_key, role_family, module, seniority_level, region,
         work_model, employer_type, credential, period,
         n_observations,
         blended_p10, blended_p25, blended_median, blended_p75, blended_p90,
         remote_share, confidence_tier, median_delta_90d, spark, updated_at
  from public.benchmark_published;
grant select on public.benchmark_public to anon, authenticated;

-- 3) Survey quarantine + trend keys
alter table public.survey_responses
  add column if not exists status      text not null default 'accepted',
  add column if not exists verified    boolean not null default false,
  add column if not exists source      text not null default 'survey',
  add column if not exists survey_year int,
  add column if not exists credential  text,
  add column if not exists external_id text;
create unique index if not exists survey_responses_external_id_key
  on public.survey_responses (external_id) where external_id is not null;

alter table public.comp_observations
  add column if not exists survey_year  int,
  add column if not exists credential   text,
  add column if not exists external_ref text;

-- 4) Published sentiment aggregates (suppressed at publish; safe for anon)
create table if not exists public.sentiment_published (
  id              uuid primary key default gen_random_uuid(),
  metric_key      text not null,
  metric_label    text,
  option_key      text not null,
  option_label    text,
  survey_year     int not null,
  role_family     text not null default 'all',
  seniority_level text not null default 'all',
  employer_type   text not null default 'all',
  work_model      text not null default 'all',
  region          text not null default 'all',
  n               int not null,
  pct             numeric,
  avg_score       numeric,
  sort_order      int,
  updated_at      timestamptz default now(),
  unique (metric_key, option_key, survey_year, role_family, seniority_level,
          employer_type, work_model, region)
);
alter table public.sentiment_published enable row level security;
drop policy if exists "public read sentiment" on public.sentiment_published;
create policy "public read sentiment" on public.sentiment_published
  for select to anon, authenticated using (true);

-- 5) Published market-pulse feed (auto-generated at publish; safe for anon)
create table if not exists public.pulse_published (
  id          uuid primary key default gen_random_uuid(),
  ts          timestamptz not null default now(),
  kind        text not null check (kind in ('benchmark_move','demand_shift','new_data','industry_news')),
  text        text not null,
  role_key    text,
  delta_value numeric,
  delta_unit  text check (delta_unit in ('$','pts','%')),
  active      boolean not null default true
);
alter table public.pulse_published enable row level security;
drop policy if exists "public read pulse" on public.pulse_published;
create policy "public read pulse" on public.pulse_published
  for select to anon, authenticated using (active);

-- 6) Published demand shares (relative heat only — exact counts stay gated)
create table if not exists public.demand_published (
  key        text primary key,       -- role_family or module key
  label      text not null,
  dimension  text not null default 'role_family',
  share      numeric not null,       -- 0..1 of openings in window
  delta_30d  numeric,                -- share change, points
  updated_at timestamptz default now()
);
alter table public.demand_published enable row level security;
drop policy if exists "public read demand" on public.demand_published;
create policy "public read demand" on public.demand_published
  for select to anon, authenticated using (true);

-- 7) Single-row freshness meta for the live bar
create table if not exists public.freshness_published (
  id                 int primary key default 1 check (id = 1),
  benchmark_cells    int not null,
  total_respondents  int not null,
  postings_ingested  int not null,
  last_survey_ingest timestamptz,
  last_pulse_refresh timestamptz,
  as_of              timestamptz not null default now(),
  window_label       text not null
);
alter table public.freshness_published enable row level security;
drop policy if exists "public read freshness" on public.freshness_published;
create policy "public read freshness" on public.freshness_published
  for select to anon, authenticated using (true);

-- 8) Tier-2 access codes (service-role only: RLS on, no anon policy)
create table if not exists public.access_codes (
  id                 uuid primary key default gen_random_uuid(),
  email              text not null,
  code               text not null,
  first_name         text,
  company            text,
  role_interest      text,
  survey_response_id uuid references public.survey_responses(id),
  hubspot_id         text,
  created_at         timestamptz default now(),
  expires_at         timestamptz default now() + interval '45 days',
  used_count         int default 0
);
create index if not exists access_codes_email_created_idx
  on public.access_codes (email, created_at);
alter table public.access_codes enable row level security;

-- follow-up (applied as comp_observations_add_work_model)
alter table public.comp_observations add column if not exists work_model text;
