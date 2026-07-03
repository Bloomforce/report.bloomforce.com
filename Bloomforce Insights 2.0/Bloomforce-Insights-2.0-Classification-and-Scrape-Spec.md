# Bloomforce Insights 2.0 — Classification & Scrape-Scope Spec
### How a raw job becomes a specific role, and how to broaden ingestion to cover every role

**Date:** June 17, 2026
**Companion to:** the Role Taxonomy (v1 locked) and the Salary Data Plan
**Validated on:** `public.jobs` (1,759 Epic-relevant)

---

## Why this works — measured on your real data

| Fix | Impact (measured) |
|---|---|
| **Exclusion gate** removes clinical false-positives | **193 jobs (11%)** like medical assistant / RN / pharmacy tech drop out — un-pollutes the benchmark |
| **Scan description, not just title**, for modules | Module-detectable jobs rise **107 → ~488 (4.5×)** |
| Seniority parse | **520 jobs (30%)** carry an explicit level token; the rest default by rule |

---

## Part 1 — Role classification pipeline

Maps every job → `role_key = family[.module].level` with per-dimension confidence and provenance.

### Step 0 — Epic-IT relevance gate (new `is_epic_it_role` flag)

True only if **(a)** an Epic-IT signal is present **and (b)** it's not a hard clinical/ops exclusion.

- **Epic-IT positive** (title *or* description): `epic` near {analyst, application(s), build, configuration, coordinator, "report writer", "BI developer", interface, integration, "principal trainer", "credentialed trainer", informatics, security, "client systems", ECSA} — **or** any `epic_module_taxonomy` alias + an analyst/build token.
- **Hard exclude** (title): medical assistant · registered nurse / RN (bedside) · physician (clinical) · pharmacy technician · dental assistant/hygienist · phlebotomist · scheduling/referral coordinator · business office rep · patient access rep · practice manager · medical receptionist · revenue-integrity **coder**. → drop unless a strong Epic-build signal overrides.

### Step 0.5 — Synonym batching (different orgs, same role)

Different employers name the same job differently. **Batch synonyms into one family before anything else** so the benchmark isn't fragmented (and isn't polluted by look-alike titles). The canonical map lives in `role_taxonomy.aliases` (a `text[]` per family) and is the single source of truth the classifier and n8n pipeline both read.

- **Application Analyst = Application Coordinator.** "Application Coordinator," "Applications Coordinator," "Epic Application Coordinator," "Application Analyst/Coordinator," "Application Coordinator III," "Business/Clinical Systems Analyst," "App Programmer/Analyst," "EHR/Epic Analyst," "Systems Analyst (clinical apps)" → **all map to `AA`.** There is no separate `AC` family.
- **"Coordinator" is only AA with application/Epic/module context.** Bare "coordinator" titles (Clinical Research, Patient Care, Scheduling, Care, Program, Referral, Intake, Data coordinator) are **not** Epic-IT roles → exclude. (Measured: of 200 coordinator-titled postings in the 12-mo scrape, ~5 were genuine Epic Application Coordinators at ~$99–108k; the rest were clinical/admin at ~$56–70k. A naive "coordinator→AC" bucket was 95% noise — removed.)
- Other families carry alias lists too: **BI** (Cogito/Clarity/Caboodle/Reporting/BI developer), **INT** (Interface/Integration/Bridges/HL7), **SEC** (Security/Identity/IAM/Access), **TECH** (ECSA/Client Systems/DBA/Architect/Infra), **CI** (Clinical/Nursing Informatics, Informaticist), **PM** (Project/Program/Implementation Manager), **MGR/DIR/VP/EXEC** (Manager/Director/AVP/VP and CIO·CMIO·CNIO·CHIO·CTO). Match title (and description) against `role_taxonomy.aliases` case-insensitively; longest/most-specific alias wins; leadership still keyed off seniority + direct-reports, not title alone.

### Step 0.6 — Clinical credential (a real pay premium — capture it)

Some build roles require a clinical license, and they pay materially more. Measured on the scrape: Willow/pharmacy roles requiring a **PharmD/RPh run ~$144–148k vs ~$112k non-licensed (+29%)**. Treat credential as a first-class dimension.

- **Detect from BOTH the title and the structured fields** — `core_job_title` *and* `licenses_or_certifications` + `*_degree_requirement` / `*_degree_fields_of_study`. (hiring.cafe v5 descriptions come back empty, so these structured fields are the only free-text-equivalent source.) The credential is in the **title** in ~12 of the pharmacy roles ("Informatics Pharmacist", "Clinical Informatics Pharmacist", "Pharmacist") and in **fields only** in ~21 more — you need both.
- Tokens (case-insensitive): `pharmd | pharm.d | rph | r.ph | pharmacist | registered/licensed pharmacist | doctor of pharmacy` → **PharmD/RPh**; `registered nurse | \bRN\b | BSN | MSN | nurse informaticist` → **RN**; `RHIA | RHIT | CCS` → **HIM**; `\bMD\b | \bDO\b` → **physician**.
- **Do NOT hard-exclude "Informatics Pharmacist" / "Clinical Informatics Nurse" / "Nurse Informaticist" as clinical.** With an Epic/informatics signal they ARE the *credentialed* build/informatics analyst (AA/CI) — and the high end of the range. Route them in, tagged `credential`.
- Store `credential` on `comp_observations` / `benchmark_published` so "licensed vs standard" becomes a real cut. The contribution form already collects it (PharmD/RPh · RN/BSN · RHIA/RHIT · MD/DO · None).

### Step 0.7 — Technical-track modules are their own family (not AA)

Two Epic "modules" are really standalone technical disciplines and must route to their **own family**, overriding any generic application-analyst match:

- **Bridges** (interface engine / HL7 / integration) → **INT** (Interface / Integration Analyst).
- **Cogito / Clarity / Caboodle** (reporting, analytics, data warehouse) → **BI** (Reporting / BI Developer).

Never file these under AA. (Pulled out of AA on June 20, 2026 — `AA.bridges.*` and `AA.cogito.*` removed; the correctly-filed `INT.bridges.*` / `BI.cogito.*` cells are retained.) Net effect on the family aggregates: **AA and INT ≈ unchanged; BI is currently understated (~$110k) and lifts toward ~$120–130k** once Cogito/reporting roles fold in (they run ~$127k median). This fully settles on the next clean republish, which applies these family routes from the start.

### Step 1 — Role family (ordered rules; first match wins)

| Order | Family | Match tokens (title, then description) |
|---|---|---|
| 1 | **EXEC** | `cio`, `cmio`, `cnio`, `chio`, "chief (medical/nursing/health) information officer" |
| 2 | **VP** | "vice president", `vp`, `avp` |
| 3 | **DIR** | "director", "executive director", "head of" |
| 4 | **PM** | "project manager", "program manager", `pmo`, "scrum master" |
| 5 | **MGR** | "manager", "supervisor" (not already PM) |
| 6 | **PT** | "principal trainer", "instructional designer" |
| 7 | **CT** | "credentialed trainer", "classroom trainer" |
| 8 | **CI** | "clinical/nursing/pharmacy informatics", "informaticist" (IC, not manager) |
| 9 | **SEC** | "security", "identity", "provisioning", "access management" |
| 10 | **TECH** | `ecsa`, "client systems", "chronicles", "caché/cache", "environment", "hyperspace", "cogito DBA/administrator" |
| 11 | **INT** | "interface", "integration", "bridges", "care everywhere", `hl7`, `fhir` |
| 12 | **BI** | "business intelligence", "BI developer", "report writer", "clarity", "caboodle", "cogito", "slicer dicer", "reporting analyst/developer" |
| 13 | **AC** | "application coordinator", "lead analyst", "advanced/principal application analyst" |
| 14 | **AA** | "analyst", "application", "build", "configuration" — **default** for remaining Epic-IT |
| — | review | no match → queue for LLM fallback |

*Management title beats domain:* "Manager, Pharmacy Informatics" → **MGR** (specialty tag = informatics), not CI.

### Step 2 — Seniority → ladder

- **IC families (AA/AC/INT/BI/SEC/TECH/CI/PT/CT):** `associate|jr|junior|analyst i` → **L1**; default/`analyst ii` → **L2**; `senior|sr|advanced|iii` → **L3**; `principal|lead|iv|coordinator` → **L4**.
- **Management:** MGR → **M1**, DIR / exec director → **M2**, VP / AVP → **M3**, CIO/CMIO/CNIO/CHIO → **Exec**.

### Step 3 — Epic module (reuse `epic_module_taxonomy`)

For families **{AA, AC, INT, BI, MGR, DIR}**: scan **title + description** for module `aliases`, require a `required_context` term, apply `exclusion_terms`, take the highest score ≥ `min_confidence`. Keep `module_primary` (+ optional secondary). Else `module = general`. (This is the 107 → ~488 lift.)

### Step 4 — Compose + score

`role_key = family[.module].level` (e.g. `AA.willow.L3`). Confidence per dimension: exact title match = **high**, description-only = **medium**, inferred/default = **low**.

### Step 5 — Deterministic-first, LLM-fallback (hybrid)

Rules handle the bulk transparently. The NULL/low-confidence remainder goes to an **LLM pass** (title + description → `{family, module, level, confidence}`) constrained to the taxonomy vocabulary — fits your existing `agent_*` infrastructure. Persist to a **`job_role_classification`** table: `job_id, is_epic_it_role, role_family, module_primary, module_secondary, seniority_level, role_key, *_confidence, method (rules|llm), classified_at`.

### Validation gate

Spot-check a labeled set (≥90% family precision); confirm classified **Analyst median tracks the survey** — it already does ($103.5k vs $104k).

---

## Part 2 — Scrape-scope broadening

**Goal:** enough volume per `role_key × region` cell to publish comp at module × seniority — especially Director-and-below, where disclosure already holds ~40%.

1. **Widen the employer universe** — from today's **408 accounts / 686 companies** to: all US health systems & hospitals (target list), Epic consultancies/MSPs (Nordic, Tegria, Huron, HCTec, CSI, Optimum, Avaap/Bluetree…), Epic Systems, and academic medical centers.
2. **Add comp-rich sources** — lean into `hiring_cafe` (47% comp); add comp-normalizing aggregators and pay-transparency-state career pages. Keep Workday/iCIMS as **demand-only** (3–13% comp).
3. **Loosen the intake filter, tag strictly** — ingest broadly, then let the Step-0 gate + classifier decide Epic-IT vs not. (You currently miss Director/module roles whose titles don't say "Epic.")
4. **Prioritize transparency jurisdictions** (CO/CA/WA/NY/IL…) for the comp spine; extrapolate to non-disclosing states via regional differentials.
5. **Classify at ingest** — run Part 1 on intake; low-confidence → review queue.
6. **Historical backfill** — deepen per-cell N and trend lines.
7. **Coverage-driven collection** — a `role_key × region` scorecard; target **≥15 comp observations = "Direct,"** else Blended/Modeled (flagged). Point new sources at the red cells.
8. **De-dupe** by `fingerprint` across the wider net.

**Coverage math:** at ~40% disclosure, ≥15 comp obs per Director/module cell needs ~38 postings/cell — very reachable once the employer net widens 5–10× from 686 companies. **C-suite tail:** don't chase via scrape — use IRS 990 + placements (Salary Data Plan).

---

## Part 3 — What needs your 'go' (database writes)

I won't run these without explicit approval — happy to hand you the SQL/migrations to review first:

1. `is_epic_it_role` flag + **`job_role_classification`** table, and a backfill pass over the 2,078 existing rows (rules + LLM fallback).
2. The **`comp_observations` → `benchmark_published`** pair from the Salary Data Plan (the aggregated, RLS-safe surface the public site reads).

**Immediate no-risk option:** I can run the full classifier as a **read-only `SELECT`** over your current data first — so you see the new role distribution, module fill-rate, and per-role medians before anything is written.
