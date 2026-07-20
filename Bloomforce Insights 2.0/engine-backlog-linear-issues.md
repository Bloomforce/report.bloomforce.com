# Data Engine Backlog — Linear Issue Drafts

Drafted 2026-07-19 from the full engine investigation. Each section below is one
Linear issue, ready to paste (or to be created via the Linear MCP once connected).
Suggested project: **Insights 2.0 — Data Engine**. Priorities use Linear's scale
(Urgent / High / Medium / Low).

---

## Issue 1 — Close the contribution loop: automated nightly promote + re-aggregate

**Priority:** High · **Labels:** `data-engine`, `automation` · **Estimate:** 3–5 pts

### Why
The benchmark is only "living" if new data moves the public numbers without a human
in the loop. Today a web contribution (POST `/api/insights/contribute`) lands in
`survey_responses` with `status='pending'` and **stays there** until someone
manually runs `scripts/promote-contributions.ts` and then re-runs `npm run seed`
and applies the SQL by hand. Contributors are promised their number strengthens
the benchmark — right now that promise is manual.

### Current state (file paths)
- `src/app/api/insights/contribute/route.ts` — inserts pending row + access code, sets HMAC unlock cookie.
- `scripts/promote-contributions.ts` — validates pending rows → inserts into `comp_observations`. Docstring says "nightly via cron/n8n, or manually"; nothing invokes it.
- `scripts/seed/run-all.ts` + `scripts/seed/publish.ts` — full re-aggregation, currently emits SQL files (`scripts/seed/out/*.sql`) applied by hand.
- Blocked by Issue 2 (direct-write sink) for the final hop.

### Scope
- [ ] Create a scheduled job (Vercel Cron hitting an authed route, or GitHub Action on cron — pick one and document it) that runs nightly:
  1. `promote-contributions` (validation rules already in the script: comp sanity bounds, required fields, dedupe by `external_id`).
  2. Re-aggregation limited to publish tables (`benchmark_published`, `sentiment_published`, `freshness_published` counts) — via the direct sink from Issue 2.
- [ ] Add outcome logging to `ingest_runs` (see Issue 6) with counts: pending seen, promoted, rejected (+reason), cells republished.
- [ ] Alert on failure (email via existing Resend wiring is fine).
- [ ] Idempotency: running twice in a row must not duplicate observations (`external_id` unique constraint already exists — verify the promote script relies on it).

### Acceptance criteria
- A contribution submitted at 5pm is reflected in `benchmark_public` (and the site's freshness bar respondent count) by the next morning with zero manual steps.
- A malformed contribution is rejected with a logged reason, not silently dropped.
- Re-running the job is a no-op when there's nothing pending.

---

## Issue 2 — Direct-write Supabase sink: make `npm run seed` fully idempotent and headless

**Priority:** High (prerequisite for Issues 1 & 3 automation) · **Labels:** `data-engine`, `infra` · **Estimate:** 3 pts

### Why
The pipeline's output path is SQL files applied manually in the Supabase SQL
editor. `SupabaseSink` exists in `scripts/lib/sink.ts` but its `raw()` throws —
the cleanup `DELETE`s and RLS-guarded writes can't run through it. Until the seed
can write to the database unattended, nothing upstream can be scheduled.

### Current state
- `scripts/lib/sink.ts` — `SqlFileSink` (default, works) vs `SupabaseSink` (service role; `raw()` unimplemented).
- `scripts/seed/run-all.ts` — orchestrator; delete-and-reinsert model from flat sources.
- Publish tables: `benchmark_published`, `sentiment_published`, `pulse_published`, `demand_published`, `freshness_published`.

### Scope
- [ ] Choose one: (a) an `exec_sql` RPC (service-role-only Postgres function) so `SupabaseSink.raw()` can run the cleanup statements, or (b) restructure publish writes as delete-by-period + batch upserts through PostgREST (no raw SQL needed). Option (b) is cleaner long-term.
- [ ] Wrap the publish in a transaction or write to a staging period then flip, so a mid-run failure never leaves the public views half-written.
- [ ] `npm run seed -- --sink=supabase` documented in the repo README; SQL-file mode kept as fallback.
- [ ] Verify RLS: writes go through service role only; anon surface unchanged (`benchmark_public` view still hides Director+/M2/M3/exec).

### Acceptance criteria
- `npm run seed -- --sink=supabase` from a clean checkout (with env vars) updates all five publish tables with no manual SQL step.
- Running it twice produces identical row counts (idempotent).
- A killed mid-run seed leaves the previous publish intact.

---

## Issue 3 — Classify employer_type for scraped postings (org-type enrichment)

**Priority:** High · **Labels:** `data-engine`, `classification`, `org-slice` · **Estimate:** 3–5 pts

### Why
The org-type pay slice (now on `/preview/briefing`) is the thinnest part of the
benchmark: employer-type cells are **survey/public-record only** because
`buildObservations()` sets `employer_type = null` for every scraped posting.
That's why children's hospitals show n=6 "modeled" while the posting pool has
thousands of rows from named employers. Classifying the employer on postings
multiplies org-cut sample sizes without collecting a single new survey response.

### Current state
- `scripts/seed/load-jobs.ts` — parses Apify hiring.cafe JSON; company name available on each posting.
- `scripts/seed/publish.ts buildObservations()` — hardcodes `employer_type: null` for posted observations.
- `scripts/lib/normalize.ts normalizeEmployerType()` — existing keyword matcher used for survey free-text (11 types incl. `academic`, `childrens`, `multi_state_system`, `consulting_msp`, `vendor_healthtech`).
- Taxonomy labels: `src/lib/insights/employer-types.ts`.

### Scope
- [ ] Build an employer classification table: seed with the distinct company names in the current Apify exports (few hundred uniques), mapped to employer_type. Sources: keyword rules first (Children's/Universitätsklinik-style patterns: "Children's", "University", "Health System", known MSP/consulting brands), then a maintained overrides CSV for the big ambiguous names (CommonSpirit, Ascension, Trinity → `multi_state_system`, etc.).
- [ ] Wire it into `buildObservations()` so posted observations carry employer_type when confidently matched; leave null when not (never guess into `other`).
- [ ] Keep `capEmployers` behavior (single employer ≤40% of a cell) — especially important once big systems' postings enter org cells.
- [ ] Decide blending disclosure: org-type cells will move from `direct` to `blended`/`direct` mixes — confirm confidence-tier logic reads correctly per cell and the UI's "modeled" flag still means what it says.
- [ ] Re-run seed; sanity-check AA org medians against survey-only values (large unexplained swings = classification bug).

### Acceptance criteria
- ≥60% of benchmark-eligible postings carry a non-null employer_type.
- Every org-type cell for AA reaches n≥15 (tier `direct`/`blended`) or is explicitly explained.
- A misclassification found later is fixable by editing one overrides row + re-seed.

---

## Issue 4 — Schedule the Apify hiring.cafe scrape + automated ingestion

**Priority:** Medium-High · **Labels:** `data-engine`, `automation`, `scraping` · **Estimate:** 5 pts

### Why
Postings power freshness: trend sparklines, 90-day deltas, demand shares, pulse
items, remote share. Today someone runs the Apify actor by hand and commits JSON
into `Bloomforce Insights 2.0/apify-exports/`. Between runs, "live" numbers
quietly age.

### Current state
- Target spec already written: `Bloomforce Insights 2.0/hiring-cafe-apify-targets.md` and `…-Classification-and-Scrape-Spec.md`.
- Intended automation documented (never built) in `n8n-pipeline-spec.md` — n8n is **not** implemented; treat it as a spec, not a dependency.
- Loader: `scripts/seed/load-jobs.ts` (fingerprint dedupe is in-memory per run).
- No Apify credentials anywhere in the app env — scraping runs outside the repo today.

### Scope
- [ ] Schedule the Apify actor weekly (Apify's own scheduler is fine) with results pushed to storage (Supabase storage bucket or S3), not the git repo.
- [ ] Ingestion job (same scheduler family as Issue 1) that: pulls new exports → `raw_jobs` upsert keyed on `fingerprint` (move dedupe from in-memory to the DB so history accumulates across runs) → classification → `comp_observations` for eligible rows → triggers re-aggregation.
- [ ] Persist raw exports 12+ months for reprocessing when the classifier improves.
- [ ] Track per-run stats in `ingest_runs`: postings pulled, new vs duplicate, eligible, dropped-by-filter counts.
- [ ] Decide and document posting staleness policy (e.g., postings older than 12 months leave the benchmark window — the rolling `windowLabel` already implies this; make it real in cell filtering if it isn't).

### Acceptance criteria
- Postings from a scrape on Monday are visible in demand/trend numbers by Tuesday without human involvement.
- `postings_ingested` on the freshness bar increases week over week on its own.
- A re-run of the same export produces zero duplicate observations.

---

## Issue 5 — Deepen org-type + regional cells: more public-record and survey inputs

**Priority:** Medium · **Labels:** `data-engine`, `data-sourcing` · **Estimate:** ongoing/5 pts initial

### Why
Blended cells are only as credible as their `n`. The UM Michigan public-salary
export proved the public-record pattern works (it feeds `academic` cells today).
Many public university health systems and some state hospital authorities publish
comparable salary data. Each new import deepens `direct`-tier cells — especially
org-type and regional cuts — at near-zero marginal cost.

### Current state
- `scripts/seed/load-um.ts` + `public-salary-exports/um_michigan_medicine_observations_full.csv` — the one implemented public-record source (`source='public_record'`, type `actual`).
- Survey funnel: 2026 survey banner live on bloomforce.com; `/talent-market` page and report CTAs feed contributions.
- Org cuts currently exist for only 6 role families, National-only, several `modeled` (n<10).

### Scope
- [ ] Identify 3–5 additional public-record sources (public university health systems / state transparency portals) with role-mappable titles; document each in a sources register with refresh cadence and license/attribution notes.
- [ ] Generalize `load-um.ts` into a configurable public-record loader (per-source column mapping + employer_type + region).
- [ ] Set explicit cell-depth targets to steer sourcing: every employer_type × AA cell at n≥15; each of the 5 regions with ≥3 `direct` role cells.
- [ ] Consider publishing org-type cuts for regions beyond National once n allows (publish.ts currently emits employer-type cells at National/all-seniority only — lift that restriction behind the same MIN_CELL_N=5 guard).

### Acceptance criteria
- ≥2 new public-record sources ingested and feeding cells.
- Org-type slice on the briefing page shows zero `modeled` bars for Application Analyst.
- A written sources register exists so future imports don't depend on memory.

---

## Issue 6 — Engine housekeeping: ingest_runs logging, market-detail gaps, naming

**Priority:** Low · **Labels:** `data-engine`, `tech-debt` · **Estimate:** 2 pts

### Why
Small correctness and observability debts found in the investigation; cheap to fix
while the files are warm.

### Scope
- [ ] Create `ingest_runs` (drafted in `insights-db-schema.sql` but never migrated) and write a row from every seed/promote/ingest run (source, counts, duration, status). Issues 1 & 4 depend on it existing.
- [ ] `src/app/api/insights/market-detail/route.ts`: `demandTrend` always returns `[]`; `postedTrend` reuses `spark` with `n: 0`; hotspots implement only the `region` kind while the type allows `employerType`. Either implement or trim the types so the gated UI can't render empty promises.
- [ ] Same route: query param is `role` but matches `role_family` — rename param or document; align with `roleKey` naming used everywhere else.
- [ ] Decide fate of drafted-but-unmigrated dimension tables (`role_taxonomy`, `module_taxonomy`, `region_dim`): either migrate them and move the taxonomy out of `scripts/lib/classify.ts`, or delete them from the draft schema so the docs match reality.
- [ ] Classifier `method` column always `'rules'` — remove the dead LLM-fallback plumbing or ticket it separately if still wanted.

### Acceptance criteria
- Every automated run leaves an `ingest_runs` row.
- `market-detail` returns no permanently-empty fields.
- Draft schema and applied migrations agree.

---

### Suggested ordering
2 → 1 → 3 → 4 → 5 → 6 &nbsp;(Issue 2 unblocks 1 and 4; Issue 3 is independent and high-value for the org slice.)
