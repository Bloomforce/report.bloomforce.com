# Bloomforce Insights 2.0 — Data Gap Map & Sourcing Plan

**Date:** June 20, 2026
**Purpose:** where the benchmark is thin or empty, and exactly where to go get the data to fill it.

---

## Coverage today (n = postings / reported)

**Solid — leave alone:**
- **Application Analyst (AA)** — family 517/308, Entry 89/24, Mid 305/221, Senior 108/63; 5 markets, work-model, 9 employer types. The flagship.
- **Manager (MGR)** — family 265/218; supervisor 63, manager 144, sr-manager 55 reported; 9 employer types.
- **Director (DIR)** — family 170/34; director 47, sr-director 10 reported.

**Thin / empty — the gaps:**

| Gap | What's missing | Severity |
|---|---|---|
| **Reported pay = 0** for **Interface (INT), Project Mgr (PM), Security (SEC)** | postings only, no "what people make" | **High** |
| **Technical / ECSA (TECH)** | no published family number at all | **High** |
| **Security (SEC)** | family n=14, 0 reported, noisy (L1 n=3 @ $55k) | **High** |
| **Top IC rung — Principal / Architect (L4)** | 0 reported across every family; modeled | **High** |
| **Regional pay** | only AA has markets; every other role is National-only | **High** |
| **Leadership top** | VP n=3 reported; EXEC = chief n=7 only; no CIO vs CMIO vs CNIO split; exec-director removed (was non-IT) | Medium |
| **BI / INT depth** (now separated out) | BI 22/18, INT 28/0 — need their own depth | Medium |
| **Clinical Informatics (CI) senior/lead** | L3 n=8, L4 n=3, 0 reported | Medium |
| **Credential dimension** | not captured yet (PharmD/RPh, RN, RHIA/RHIT) | Medium |
| **Module-level** (Willow, Beaker…) | dropped until critical mass | Low (flywheel) |
| **Employer cuts for thin families** | only AA/MGR/DIR have rich employer splits | Low |

---

## Where to get it (gap → source → action)

### Set aside — H-1B / LCA wage data
Public and rich (employer · title · wage · location), but the wage is the *offered/prevailing* floor — no bonus, usually pinned to the wage-level minimum — and the sample skews to sponsors (Epic Verona, big consultancies). It would understate and misrepresent the broad health-system market. **Not using it.** The honest, on-brand source for "what people actually make" is the contribution flywheel (#1 in priority), backed by regional public salaries and 990 for the exec top.

### 1. Regional public-salary disclosures — fills **regional leadership + academic IC** beyond the Midwest
We have OSU + UM (both Midwest). Extend into the other four regions; each gives leadership + IT/informatics comp by name/title:
- **West:** University of California (Transparent California / publicpay.ca.gov), University of Washington, University of Colorado.
- **Southwest:** University of Texas System (Texas Tribune Government Salaries Explorer), Arizona (ASU / U Arizona).
- **Northeast:** SUNY (SeeThroughNY), Penn State, Rutgers, University of Maryland.
- **Southeast:** University of Florida (FloridaHasARightToKnow), UNC, UVA, UAB, University of Georgia (open.georgia.gov).
- **Action:** **Zach downloads** 3–4 of these (pick one per region) → **Claude loads** as `public_record`, tagged by region, **per-employer cap** applied (same as UM) so no single institution dominates.

### 3. IRS Form 990 — fills the **executive top** (CIO / CMIO / CNIO at private nonprofit systems)
Nonprofit health systems disclose top-officer comp on Form 990. Fills VP/Chief where public-payroll data doesn't reach (private nonprofits).
- **Source:** ProPublica Nonprofit Explorer (queryable). **Claude can pull** a set now (Ascension, CommonSpirit, Trinity, Mass General Brigham, etc.) for the informatics/IT officers.

### 4. The contribution flywheel — fills **module + credential + reported pay** everywhere (long-term)
Already built: give-to-get captures role, level, module, **credential**, employer, region, base. Every unlock is a data point. This is the durable fill for the cells no public source covers (module × level reported pay). **Action:** drive traffic/contributions.

### 5. Targeted scrape expansion — fills **thin roles + empty modules**
- Broaden the Apify hiring.cafe terms for **Security, Interface, Technical/ECSA**, the ~10 empty modules (OpTime, Stork, ASAP, Care Everywhere…), and pay-transparency states (CO/CA/NY/WA/IL).
- **Action:** **Zach runs** the expanded Apify pull → Claude classifies + loads.

---

## Priority order (do these first)

1. **Contribution flywheel = the primary source.** It's the only thing that yields *reported* pay for the exact Epic roles by level, module, credential, employer and region — proprietary and on-brand. The give-to-get gate is already built for it; everything else just bootstraps coverage until contributions reach mass. *(Drive traffic + unlocks.)*
2. **Regional public-salary files** — one each from West (UC / U-Washington) + Southeast (U-Florida) to start, then Southwest (UT) / Northeast (SUNY). Breaks the Midwest-only limit for leadership + academic IC. *(Zach downloads, Claude loads, per-employer cap.)*
3. **IRS 990 exec pull** — firms up the Chief / VP top at private nonprofit systems. *(Claude now.)*
4. **Scrape expansion** for Security / Interface / Technical + the ~10 empty modules + pay-transparency states. *(Zach runs Apify.)*
5. **Industry cross-refs** — HIMSS / CHIME / AMIA compensation summaries for directional validation (not row-level data).

Truth-types stay tagged so nothing gets blurred: postings = `posted`, survey/records/contributions = `actual`, gap-fills flagged `modeled`. The blended public number weights by sample; confidence tiers + per-employer caps keep any one source honest. (H-1B/LCA considered and set aside — see above.)
