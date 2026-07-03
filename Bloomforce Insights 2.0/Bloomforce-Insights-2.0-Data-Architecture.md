# Bloomforce Insights 2.0 — Data Architecture (separate Insights DB)
### A walled-off benchmark database fed by a deep hiring.cafe scrape, BloomOS (read-only), and the survey

**Date:** June 17, 2026
**Decisions locked:** Home = **"Workforce Data"** Supabase project (`qcmodgkcwxoilajuouue`). Feeds = **Apify hiring.cafe scrape** (primary) + **BloomOS jobs (one-way, read-only)** + **survey responses**. Placements deferred. BloomOS is never written to.

---

## 1. Two walls

1. **Insights DB ⟂ BloomOS.** The benchmark lives entirely in the **Workforce Data** project — a separate database with its own keys and RLS. The hiring.cafe scrape lands here, never in BloomOS. BloomOS data flows **into** Insights one-way only (a scheduled read-only copy); nothing flows back. Your operational CRM/pipeline stays pristine.
2. **Only `benchmark_published` is public.** Inside Insights, raw postings and observations are private (service-role only). The website reads a single aggregated, suppressed view. (This also avoids the RLS exposure BloomOS currently has.)

```
Apify hiring.cafe (12-mo, scheduled) ─┐
BloomOS jobs (read-only sync) ────────┼─►  raw_jobs ─► classify ─► comp_observations ─► benchmark_published ─► website
Survey responses (webhook) ───────────┘         (taxonomy)        (posted/actual)        (public, suppressed)
```

---

## 2. Home: the Workforce Data project

It exists and is empty today (only unused `leads` + `survey_signups`). We build the schema below into it. Separate `anon`/`service_role` keys from BloomOS, separate RLS — clean isolation with zero risk to your ops data.

---

## 3. Sources & provenance (every row is tagged)

| Source tag | What | Cadence | Role |
|---|---|---|---|
| `apify_hiringcafe` | Deep hiring.cafe scrape, last 12 months | Scheduled (weekly + incremental) | **Primary** breadth + posted comp |
| `bloomos` | One-way read-only copy of BloomOS `jobs` | Scheduled | Adds your non-hiring.cafe sources + Epic tagging |
| `survey` | Survey responses (actual comp) | Webhook | The high-trust "actual comp" spine |

Because every row carries its `source`, you can always slice the benchmark to "scrape only," "survey only," etc. — and the hiring.cafe/BloomOS overlap is de-duplicated (below).

---

## 4. Schema (full DDL in `insights-db-schema.sql`)

- **`raw_jobs`** — normalized postings from all job sources. Mirrors the useful BloomOS fields (title, company, location, `workplace_type`, `yearly_min/max_comp`, `hourly_min/max_comp`, `posted_date`, url, description) + `source`, `fingerprint`, `is_health_it`, `is_epic`.
- **`job_classification`** — taxonomy output per job: `is_epic_it_role`, `role_family`, `module_primary/secondary`, `seniority_level`, `role_key`, per-dimension confidence, `method` (rules|llm).
- **`survey_responses`** — actual comp by `role_key`, region, tenure, employer type, work model.
- **`comp_observations`** — the durable fact table. One row per observation: `observation_type` (posted|actual|modeled), `source`, `role_key`, region, period, `value`, low/high, `confidence`. Posted rows come from `raw_jobs` (midpoint + bounds), actual from `survey_responses`.
- **`benchmark_published`** — the **only public** table. Per `role_key × region × period`: `n_observations`, `p10/p25/p50/p75/p90`, `posted_median`, `actual_median`, `remote_share`, `demand_count`, `confidence_tier` (direct|blended|modeled), `updated_at`. Cells below the N threshold are suppressed.
- **Dimensions** — `role_taxonomy` (families + levels), `module_taxonomy` (a **copy** of BloomOS's `epic_module_taxonomy`, so Insights has no runtime dependency on BloomOS), `region_dim` (state → region/metro), `ingest_runs` (pipeline run log).

---

## 5. Pipelines (n8n — you already have it connected)

**A. Apify hiring.cafe ingest** (scheduled). n8n triggers your hiring.cafe Apify actor via the Apify API — first run pulls the last 12 months, later runs are incremental — fetches the dataset, normalizes, and upserts into `raw_jobs` (`source='apify_hiringcafe'`), de-duped by `fingerprint`. Then runs classification and emits `posted` `comp_observations`.

**B. BloomOS one-way sync** (scheduled). n8n does a **read-only** query against BloomOS `jobs` (only the needed columns) and upserts copies into Insights `raw_jobs` (`source='bloomos'`), de-duped against the scrape. **No writes to BloomOS, ever.**

**C. Survey intake** (webhook). Survey tool → n8n → `survey_responses` → `actual` `comp_observations`.

**D. Aggregate & publish** (scheduled, after A–C). Recompute `benchmark_published` from `comp_observations` over rolling 12-month windows: percentiles, posted-vs-actual, remote share, demand counts, confidence tier, small-N suppression.

---

## 6. De-duplication (the overlap problem)

The hiring.cafe scrape will overlap with BloomOS's `hiring_cafe`-sourced jobs (~96% of BloomOS comp came from there). De-dupe by `fingerprint = lower(normalized_title | company | location | posted_date)` (preferring `apply_url` when present). Keep one canonical row, record which sources saw it, and **count each posting once** in the benchmark. The deep scrape generally supersedes BloomOS's filtered slice; BloomOS uniquely adds its non-hiring.cafe sources and Epic tags.

---

## 7. Security / RLS (clean from day one)

- RLS **enabled** on every table. `raw_jobs`, `job_classification`, `comp_observations`, `survey_responses`, dims → **service-role only** (n8n uses the service key; no public access).
- `benchmark_published` → a single `anon SELECT` policy (read-only) — the website's only door.
- Scrape and BloomOS-copy data are never exposed; only suppressed aggregates are.

---

## 8. Build sequence

1. **Apply the schema** to the Workforce Data project (review `insights-db-schema.sql`; I apply on your go).
2. **Seed dims** — copy `epic_module_taxonomy` from BloomOS; load `role_taxonomy` + `region_dim`.
3. **Pipeline B first** (BloomOS sync) — gives immediate data to classify and validates the schema end-to-end against numbers you've already seen.
4. **Pipeline A** (Apify hiring.cafe 12-mo) — the depth. *You provide the Apify actor + token; I wire the n8n loader.*
5. **Classifier** in-DB (rules + LLM fallback) → `comp_observations`.
6. **Pipeline D** (publish) → `benchmark_published`; point the site/prototype at it.
7. **Survey intake** when the survey data is ready.

---

## 9. What needs your go / what you provide

- **Your go to apply** `insights-db-schema.sql` to the Workforce Data project (it's empty — low risk; I won't run it without approval).
- **You provide:** the Apify hiring.cafe actor (or its ID) + API token, and the BloomOS read-only connection for the sync.
- **No Apify MCP exists** in your environment, so the actor runs in your Apify account and n8n orchestrates it — there's nothing to "connect" here on my side.
