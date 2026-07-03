# Bloomforce Insights 2.0 — n8n pipeline scaffold
### The durable ingestion path: Apify hiring.cafe → Insights DB → published benchmark

**Date:** June 18, 2026
**Target DB:** Workforce Data Supabase project (`qcmodgkcwxoilajuouue`) — never BloomOS.
**Status:** ready to build in n8n once credentials are connected (below). The field mapping is now confirmed against the real hiring.cafe export.

---

## Credentials to add in n8n first

1. **Supabase (Insights)** — Workforce Data project URL + **service-role key** (bypasses RLS for inserts). Used by all workflows below.
2. **Apify** — API token + the hiring.cafe actor ID you ran.
3. **BloomOS Supabase (read-only)** — for the one-way sync workflow only; a read-only/limited key.

I can't add these for you (they're secrets) — once they're in n8n, I can build and validate the workflows via the n8n tools.

---

## Workflow A — Apify hiring.cafe ingest (scheduled weekly)

1. **Schedule Trigger** — weekly (first run = 12-month backfill already done via your manual export).
2. **Apify node → Run actor / Get dataset items** — your hiring.cafe actor; pull new items.
3. **Code/Set node → normalize** to `raw_jobs`, mapping the confirmed fields:

| raw_jobs column | hiring.cafe source (`v5_processed_job_data` unless noted) |
|---|---|
| source | `'apify_hiringcafe'` (constant) |
| source_job_id | top-level `id` |
| job_title | `core_job_title` |
| company | `company_name` (or `enriched_company_data.name`) |
| company_domain | `company_website` |
| job_url | top-level `apply_url` |
| location | `formatted_workplace_location` |
| state | first of `workplace_states` → 2-letter |
| workplace_type | `workplace_type` (Remote/Hybrid/Onsite) |
| yearly_min_comp / yearly_max_comp | `yearly_min_compensation` / `yearly_max_compensation` (pre-annualized) |
| hourly_min_comp / hourly_max_comp | `hourly_min_compensation` / `hourly_max_compensation` |
| posted_date | `estimated_publish_date` |
| is_epic / is_health_it | derive: `technical_tools` contains Epic / `company_sector_and_industry='Healthcare'` |
| fingerprint | `lower(core_job_title|company|state|posted_date)` |
| raw | the whole `v5_processed_job_data` (+ enriched_company_data) as JSON |

4. **Supabase node → upsert** into `raw_jobs` on `(source, source_job_id)` — idempotent; de-dupe on `fingerprint`.
5. Log run to `ingest_runs`.

*Note:* keep `is_compensation_transparent` in `raw` — it separates posted vs. estimated comp.

---

## Workflow B — Classify (after A)

1. Read new `raw_jobs` rows.
2. **Rules pass** (port the spec): exclusion gate (drop clinical false-positives via title + non-IT `job_category`) → role family → seniority (use `seniority_level` + title) → Epic module (scan `core_job_title` + `technical_tools` + `requirements_summary` against `module_taxonomy`). Compose `role_key`.
3. **LLM fallback** (your agent/OpenAI node) for low-confidence/`REVIEW` rows → `{family, module, level}` constrained to the taxonomy.
4. Upsert into `job_classification`. Emit `posted` rows into `comp_observations` (annualized `yearly` midpoint; tag region from state, work_model from `workplace_type`, employer_type from the employer classifier).

---

## Workflow C — Publish (after B, scheduled nightly)

1. Aggregate `comp_observations` over the rolling 12-month window into `benchmark_published`:
   - base (`role_key × National`), plus slices by `region`, `work_model`, `employer_type` (the dimensions now live in the schema).
   - percentiles p10–p90, posted_median, remote_share, demand_count, `confidence_tier` (direct ≥15 / blended ≥8 / modeled).
   - suppress cells below N threshold.
2. Upsert on `(role_key, region, work_model, employer_type, period)`.

The prototype already reads `benchmark_published` live — so when C runs, the site updates itself.

---

## Workflow D — BloomOS one-way sync (optional, scheduled)

Read-only query against BloomOS `jobs` → map the same columns → upsert into Insights `raw_jobs` with `source='bloomos'`, de-duped against the scrape by `fingerprint`. **No writes to BloomOS.**

---

## Build order

A → B → C first (that's the live product). D and the survey webhook after. Ping me once the three credentials are in n8n and I'll build + validate the nodes.
