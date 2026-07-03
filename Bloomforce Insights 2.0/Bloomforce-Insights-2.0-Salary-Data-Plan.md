# Bloomforce Insights 2.0 — Salary Data Coverage & Acquisition Plan
### Getting defensible comp for *every* position — analyst to CIO, in every market

**Date:** June 17, 2026
**Source of truth checked:** BloomOS Supabase (`public.jobs`, 2,078 rows, Oct 2024 – Jun 2026)

---

## 1. Where we actually stand (from your data, today)

| Signal | Reality | Implication |
|---|---|---|
| Structured comp coverage | **843 of 2,078 jobs (~41%)** have a yearly or hourly range | Most postings don't disclose pay |
| Source concentration | **~96% of all comp comes from `hiring_cafe`** (811 of 843; 47% of its postings) | One source is doing all the work — a strength *and* a single point of failure |
| Recoverable from text | Only **253** comp-less jobs even mention pay words; 83 show a `$` figure | Re-parsing descriptions tops out near **~50%** coverage — not a fix on its own |
| Classification | Title rules cut "unclassified" from 93% → **52%**; still 912 epic-relevant jobs unclassified | Title alone isn't enough; need title + module + keywords + description |
| Thin per-role cells | Leadership 34 · Clinical Informatics 3 · Project/Program 7 comp points | Mostly a **volume** gap, not disclosure (see §3.5) — broadening the scrape fills Director-and-below; only the C-suite tail needs other sources |
| Geography | `location` on **97%** (761 distinct); `workplace_type` on 82% | Regional cuts are feasible once locations are normalized to state/metro |
| Validation | Classified **Analyst median $103,532** vs. survey **$104,000** | Two independent sources agree — the thesis works |

**The honest conclusion:** posted job data is an excellent *demand* signal and a solid *IC-analyst comp* signal, but it cannot populate a full role × region × seniority benchmark on its own. Getting comp for **all** positions requires blending postings with proprietary and public sources, then normalizing and modeling the gaps with explicit confidence flags.

---

## 2. The three "truth types" of comp

Every number on the site should be traceable to one of these, and labeled accordingly:

- **Posted comp** — what employers advertise (job postings). Broad and timely, but ranges run wide and high, ~half omit it, and it skews to disclosure states. *What the market is offering.*
- **Actual comp** — what people really earn or get placed at (survey responses, your placements, candidate-reported). Highest trust, lower volume. *What people actually make.*
- **Modeled comp** — derived for thin cells from adjacent data (regional differentials, seniority deltas, hourly→yearly). Lowest trust; always flagged. *Our best estimate where direct data is thin.*

A credible living benchmark shows posted vs. actual side by side (the gap is itself a story) and is transparent about which cells are modeled.

---

## 3. The acquisition plan — sources in priority order

| # | Source | Truth type | What it adds | Effort |
|---|---|---|---|---|
| 1 | **Comp-rich aggregators (lean into `hiring_cafe`)** | Posted | Already your best source at 47% comp. Capture its normalized comp fully; expand similar aggregators. Treat ATS-direct (Workday/iCIMS) as *demand-only*. | Low |
| 2 | **Pay-transparency jurisdictions** | Posted | CO, CA, WA, NY, IL, etc. legally require ranges. Parse `location` → state → transparency flag; use as a clean posted spine, extrapolate to non-disclosing states via differentials. | Low–Med |
| 3 | **Description re-parse** | Posted | Recover the ~250 jobs that state pay in body text but missed structured capture. Modest, one-time. | Low |
| 4 | **H-1B LCA / PERM disclosure data** | Actual (offered) | Free, public, structured DOL filings: employer + role (SOC) + **actual offered wage** + worksite. Huge for Epic analyst/developer roles at health systems, Epic, and consultancies. Map SOC + employer → your roles. | Med |
| 5 | **Survey responses (wire into Supabase)** | Actual | Your proprietary spine — self-reported real comp by role/region/tenure. **Not in Supabase yet** (Workforce Data tables are empty). | Med |
| 6 | **Crelate placements & bill rates** | Actual | Gold: real placement comp and contract bill rates (→ FTE-equivalent). Uniquely yours; highest signal. `crelate_opportunity_id` is already on `jobs`. | Med |
| 7 | **Candidate comp expectations** | Actual | From your 9,617 contacts / recruiting conversations — current & desired comp. Captures the candidate side. | Med |
| 8 | **Analyzer + Explorer flywheel** | Actual | Every hiring manager who submits a posting + budget, and every "where do you stand" entry, is a data point. The lead-gen tool doubles as a collection engine. | Low (built-in) |
| 9 | **BLS OEWS** | Public baseline | Authoritative occupational wage baselines by metro. Use as a sanity anchor and to build regional differentials for modeling. | Low |
| 10 | **Historical backfill** | Posted | Deepen trend lines and per-cell N by pulling older postings (aggregator history, archived boards, Wayback for career pages). | Med |
| 11 | **Enrichment vendors (Clay / ZoomInfo / Apollo)** | Modeled/Posted | Waterfall-enrich employer/role comp where gaps remain. Use sparingly to fill, not anchor. | Med |

**Sequencing:** 1–3 are cheap wins on data you already touch. **Broadening the scrape itself** (more employers/boards, a looser Epic filter) is the single biggest lever for Director-and-below comp — see §3.5. **4 (H-1B) and 5–6 (survey + placements)** add *actual* comp: the truth-check on posted ranges and the fix for the C-suite tail. 8 compounds over time for free. 9–11 fill and sanity-check.

---

## 3.5 Will broadening the scrape fill leadership? Mostly — yes

A fair pushback: if leadership cells are thin, scrape more jobs. The data backs this up — pay **disclosure rate is roughly flat across seniority**, so it's *volume* that's thin, not disclosure:

| Tier | Postings | With comp | Disclosure |
|---|---|---|---|
| Other IC | 1,092 | 491 | 45% |
| Analyst | 582 | 231 | 40% |
| Manager | 17 | 11 | 65% |
| Director | 59 | 24 | **41%** |
| VP | 4 | 0 | — (N too small) |
| C-suite | 5 | 2 | — (N too small) |

Director discloses at **41% — essentially identical to Analyst (40%)**. So broadening the scrape to capture ~10× the Director/Manager postings yields ~10× the comp points. And the headroom is enormous: you're at just **686 companies / 408 accounts** today, heavily Epic-filtered. Loosening the filter and adding boards/employers fills Director-and-below comp directly. **For everything Director and below, broadening the scrape is the right primary lever.**

The one genuine wall is the **literal C-suite (VP / CMIO / CNIO / CIO)**: those roles are rare in public postings at any moment, and they often run through retained search rather than job boards — so volume scales slowly no matter how wide you cast. For that tail, two cheap sources beat scraping: (a) **IRS Form 990** — nonprofit health systems must publicly disclose their highest-paid officers' compensation, covering CIO/CMIO/CNIO at most of your target accounts; and (b) your own **placement data**. Broaden the scrape for the body of the market; use 990 + placements for the top.

---

## 4. Normalize, reconcile, and store it once

Land everything in a single fact table — **`comp_observations`** — one row per observation:

`source · source_type (posted/actual/modeled) · role_family · seniority · region/metro · period · value · low/high · currency · confidence · raw_ref`

Normalization rules: hourly → yearly (× ~2,080); contract bill rate → FTE-equivalent (apply a load factor); range → midpoint *and* keep bounds; dedupe by `fingerprint`; reconcile posted-vs-actual (expect posted to read wide and ~5–15% high versus actual). This table is the durable asset — every source above just writes rows into it.

From it, build the **published benchmark** the site reads: `role_family × seniority × region × period → p10/p25/p50/p75/p90, N, confidence`. Aggregate-and-suppress any cell below an N threshold (privacy + small-N honesty).

---

## 5. Model the gaps — and flag them

Even with all sources, some cells stay thin (e.g., CMIO in the Midwest). For those, model: `national role median × regional differential (from BLS/your data) × seniority delta`. Label every published number:

- **Direct** — enough real observations in-cell (green)
- **Blended** — in-cell + adjacent/regional model (amber)
- **Modeled** — derived, low N (grey, with a clear "estimate" tag)

Showing the confidence *increases* trust. It's the difference between a benchmark and a guess.

---

## 6. Coverage scorecard — know where to collect next

Stand up one internal view: a **role × region × seniority matrix**, each cell colored by N and confidence. It tells you, at a glance, exactly where you're thin and which source to point at the gap. Set target thresholds (e.g., ≥15 actual observations for "Direct"). Collection stops being guesswork and becomes "fill the red cells."

---

## 7. How this plugs into the build

- **Phase 1:** create `comp_observations` + `benchmark_published`; load existing `jobs` comp (843 rows) + description re-parse; wire the survey into Supabase. Improve classification (title + `epic_module_*` + `epic_keywords_matched` + description) to cut the 52% "Other."
- **Phase 2:** add H-1B LCA + pay-transparency parsing + BLS differentials; stand up the coverage scorecard. Ship the Analyzer (which now also *collects* comp).
- **Phase 3:** wire Crelate placements + candidate expectations; turn on modeling + confidence flags; publish the blended benchmark.

**One risk to design around now:** ~96% of posted comp depends on a single aggregator. Adding H-1B, survey, and placements isn't just coverage — it's resilience.

---

## 8. Security note (carry-over)

`public.jobs` and 36 other BloomOS tables have **Row-Level Security disabled** — anyone with the anon key can read/modify every row. The public Insights site must read only the aggregated `benchmark_published` surface (or a separate project), never raw BloomOS. Enable RLS deliberately with policies before anything public connects. (SQL available on request; not run here.)
