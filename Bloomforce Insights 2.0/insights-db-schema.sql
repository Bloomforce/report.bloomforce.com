-- =============================================================================
-- Bloomforce Insights 2.0 — Insights benchmark database schema
-- Target: the "Workforce Data" Supabase project (qcmodgkcwxoilajuouue)
-- Status: REVIEWABLE DRAFT — do not apply until approved. Walled off from BloomOS.
--
-- Design notes:
--  * Every job/observation carries a `source` tag (apify_hiringcafe | bloomos | survey).
--  * Only `benchmark_published` is exposed to the public (anon) role; everything
--    else is service-role only (n8n uses the service key, which bypasses RLS).
--  * BloomOS is only ever READ (one-way sync into raw_jobs); never written to here.
-- =============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Dimensions
-- ---------------------------------------------------------------------------

-- Role families + seniority handling (from the locked Role Taxonomy v1)
create table if not exists public.role_taxonomy (
  code          text primary key,             -- AA, AC, INT, BI, SEC, TECH, PT, CT, PM, MGR, DIR, VP, EXEC, CI
  label         text not null,
  role_group    text not null,                -- 'ic' | 'management'
  takes_module  boolean not null default false,
  sort_order    int
);

-- Copy of BloomOS epic_module_taxonomy so Insights has NO runtime dependency on BloomOS.
create table if not exists public.module_taxonomy (
  key              text primary key,          -- willow, beaker, cadence, resolute_hb, cogito, ...
  display_name     text not null,
  family           text,                      -- clinical, access, revenue_cycle, analytics, integration, ...
  aliases          text[]  default '{}',
  required_context text[]  default '{}',
  exclusion_terms  text[]  default '{}',
  min_confidence   numeric default 0.78,
  active           boolean default true
);

-- State -> region/metro + pay-transparency flag (for regional cuts + comp spine)
create table if not exists public.region_dim (
  state             text primary key,         -- 'TX', 'CA', ...
  region            text not null,            -- Northeast, West, Southeast, Midwest, ...
  metro             text,
  pay_transparency  boolean default false
);

-- Pipeline run log
create table if not exists public.ingest_runs (
  id             uuid primary key default gen_random_uuid(),
  source         text not null,               -- apify_hiringcafe | bloomos | survey | publish
  started_at     timestamptz not null default now(),
  finished_at    timestamptz,
  status         text default 'running',      -- running | ok | error
  rows_in        int,
  rows_upserted  int,
  notes          text
);

-- ---------------------------------------------------------------------------
-- Raw layer: normalized postings from every job source
-- ---------------------------------------------------------------------------
create table if not exists public.raw_jobs (
  id              uuid primary key default gen_random_uuid(),
  source          text not null,              -- apify_hiringcafe | bloomos
  source_job_id   text,                       -- id in the originating system
  job_url         text,
  company         text,
  company_domain  text,
  job_title       text,
  location        text,
  state           text,
  metro           text,
  workplace_type  text,                       -- remote | hybrid | onsite
  yearly_min_comp numeric,
  yearly_max_comp numeric,
  hourly_min_comp numeric,
  hourly_max_comp numeric,
  currency        text default 'USD',
  posted_date     date,
  first_seen_at   timestamptz default now(),
  last_seen_at    timestamptz default now(),
  closed_at       timestamptz,
  job_description  text,
  is_health_it    boolean,
  is_epic         boolean,
  fingerprint     text,                       -- lower(title|company|location|posted_date) for cross-source dedup
  raw             jsonb,                       -- original payload
  ingest_run_id   uuid references public.ingest_runs(id),
  ingested_at     timestamptz default now(),
  unique (source, source_job_id)              -- idempotent per-source upserts
);
create index if not exists idx_raw_jobs_fingerprint on public.raw_jobs (fingerprint);
create index if not exists idx_raw_jobs_source       on public.raw_jobs (source);
create index if not exists idx_raw_jobs_posted       on public.raw_jobs (posted_date);

-- ---------------------------------------------------------------------------
-- Classification: taxonomy output, 1 row per job
-- ---------------------------------------------------------------------------
create table if not exists public.job_classification (
  id                    uuid primary key default gen_random_uuid(),
  raw_job_id            uuid not null references public.raw_jobs(id) on delete cascade,
  is_epic_it_role       boolean,
  role_family           text,                 -- AA, DIR, ...
  module_primary        text,                 -- references module_taxonomy.key (nullable)
  module_secondary      text,
  seniority_level       text,                 -- L1..L4, M1, M2, M3, exec
  role_key              text,                 -- family[.module].level  e.g. AA.willow.L3
  family_confidence     numeric,
  module_confidence     numeric,
  seniority_confidence  numeric,
  method                text,                 -- rules | llm
  classified_at         timestamptz default now(),
  unique (raw_job_id)
);
create index if not exists idx_job_class_rolekey on public.job_classification (role_key);

-- ---------------------------------------------------------------------------
-- Survey responses: actual self-reported comp (the high-trust spine)
-- ---------------------------------------------------------------------------
create table if not exists public.survey_responses (
  id               uuid primary key default gen_random_uuid(),
  submitted_at     timestamptz default now(),
  role_family      text,
  module           text,
  seniority_level  text,
  role_key         text,
  region           text,
  state            text,
  years_experience numeric,
  employer_type    text,                      -- health system, consultancy, vendor, ...
  work_model       text,                      -- remote | hybrid | onsite
  base_comp        numeric,
  bonus_comp       numeric,
  total_comp       numeric,
  currency         text default 'USD',
  raw              jsonb
);
create index if not exists idx_survey_rolekey on public.survey_responses (role_key);

-- ---------------------------------------------------------------------------
-- Unified fact table: one row per comp observation (the durable asset)
-- ---------------------------------------------------------------------------
create table if not exists public.comp_observations (
  id                 uuid primary key default gen_random_uuid(),
  observation_type   text not null,           -- posted | actual | modeled
  source             text not null,           -- apify_hiringcafe | bloomos | survey | model
  raw_job_id         uuid references public.raw_jobs(id) on delete set null,
  survey_response_id uuid references public.survey_responses(id) on delete set null,
  role_key           text not null,
  role_family        text,
  module             text,
  seniority_level    text,
  region             text,
  period             date,                    -- month or quarter start
  value              numeric not null,        -- annualized comp point
  low                numeric,
  high               numeric,
  currency           text default 'USD',
  confidence         text,                    -- high | medium | low
  created_at         timestamptz default now()
);
create index if not exists idx_obs_rolekey on public.comp_observations (role_key, region, period);
create index if not exists idx_obs_type    on public.comp_observations (observation_type);

-- ---------------------------------------------------------------------------
-- Published benchmark: the ONLY public-facing table (aggregated + suppressed)
-- ---------------------------------------------------------------------------
create table if not exists public.benchmark_published (
  id              uuid primary key default gen_random_uuid(),
  role_key        text not null,
  role_family     text,
  module          text,
  seniority_level text,
  region          text not null,
  period          date not null,
  n_observations  int,
  n_posted        int,
  n_actual        int,
  p10             numeric,
  p25             numeric,
  p50             numeric,
  p75             numeric,
  p90             numeric,
  posted_median   numeric,
  actual_median   numeric,
  remote_share    numeric,
  demand_count    int,                        -- open postings in period
  confidence_tier text,                       -- direct | blended | modeled
  updated_at      timestamptz default now(),
  unique (role_key, region, period)
);
create index if not exists idx_bench_rolekey on public.benchmark_published (role_key);

-- ---------------------------------------------------------------------------
-- Row Level Security
--   * Enable on every table.
--   * Private tables get NO policy -> anon/authenticated are denied;
--     n8n's service_role key bypasses RLS and can read/write.
--   * benchmark_published gets a read-only policy for the public website.
-- ---------------------------------------------------------------------------
alter table public.role_taxonomy      enable row level security;
alter table public.module_taxonomy    enable row level security;
alter table public.region_dim         enable row level security;
alter table public.ingest_runs        enable row level security;
alter table public.raw_jobs           enable row level security;
alter table public.job_classification enable row level security;
alter table public.survey_responses   enable row level security;
alter table public.comp_observations  enable row level security;
alter table public.benchmark_published enable row level security;

drop policy if exists "public read benchmark" on public.benchmark_published;
create policy "public read benchmark"
  on public.benchmark_published
  for select
  to anon, authenticated
  using (true);

-- (Optionally expose the taxonomy dims read-only too, if the site needs labels:)
-- create policy "public read role_taxonomy" on public.role_taxonomy
--   for select to anon, authenticated using (true);

-- =============================================================================
-- End. Next: seed role_taxonomy + region_dim, copy module_taxonomy from BloomOS,
-- then wire the n8n pipelines (BloomOS sync, Apify hiring.cafe, survey, publish).
-- =============================================================================
