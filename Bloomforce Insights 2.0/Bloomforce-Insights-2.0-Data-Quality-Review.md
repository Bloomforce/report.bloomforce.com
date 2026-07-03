# Bloomforce Insights 2.0 — Data-Quality Review & Module-Display Redesign

**Date:** June 20, 2026
**Scope:** the module-level pay ladders (and the dataset behind them), reviewed for logic, statistical quality, and credibility to a health-system IT leader.

---

## TL;DR

The **family-level numbers are solid and defensible.** The **per-module × per-level grid is not** — it's built from tiny, posting-only samples, so the ladders come out jagged (entry = mid, senior < mid). The honest fix is to stop publishing thin per-cell medians and instead **show the two things we actually know well — the analyst *career-ladder shape* and each module's *pay premium* — and combine them into a smooth, monotonic, clearly-modeled ladder.** The real data fix is the contribution flywheel (which now captures Epic module).

---

## 1. Root cause — why the ladders are "all over the place"

Three compounding problems, all in the module×level cells:

1. **Posting-only, no real pay.** Every module×level cell has `n_actual = 0`. Survey/contribution data was never tagged by module (we nulled module on the survey to avoid a mis-match bug), so there is **zero reported-pay signal by module** today. It's 100% job-ad midpoints.
2. **Sample sizes that can't support a median.** Of ~52 module×level cells, **~92% have fewer than 15 postings**; most are 3–9. A median of 3–5 advertised ranges is noise, not a benchmark. Only 4 cells clear n≥15 (Beaker L2 = 15, Bridges L2 = 16, Cadence L2 = 19, Mgr·Bridges = 22).
3. **Posting artifacts leak through.** Recurring templated figures (`$101,400` appears across Beacon, Tapestry, ClinDoc, Ambulatory, Payer) and un-trimmed outliers (HIM L2 floor `$31,636`; MyChart L3 floor `$42,224`) distort specific cells. The IQR cleaning we applied to reported pay was never fully applied to the thin posted cells.

**Net:** the grid is under-powered by ~10×. No display trick fixes a median of n=3 — the data isn't there yet.

---

## 2. Evidence — the non-monotonic ladders (Application Analyst)

| Module | Entry (L1) | Mid (L2) | Senior (L3) | n (L1/L2/L3) | Problem |
|---|---|---|---|---|---|
| Willow | $102.1k | $138.3k | $143.5k | 4 / 12 / 5 | OK shape, thin |
| Beaker | $86.4k | $100.5k | $131.1k | 3 / 15 / 5 | OK shape, thin ends |
| Cadence | $96.4k | $98.8k | $128.9k | 4 / 19 / 5 | OK shape |
| Ambulatory | $79.5k | $101.4k | $114.1k | 5 / 11 / 8 | OK shape |
| **Cogito** | **$102.7k** | **$102.7k** | $113.6k | 4 / 14 / 3 | **entry = mid** |
| **Bridges** | $88.5k | **$105.9k** | **$100.4k** | 5 / 16 / 5 | **senior < mid** |
| **Cupid** | — | **$117.6k** | **$89.3k** | – / 14 / 3 | **senior << mid** |

~40% of the multi-level analyst modules are non-monotonic — entirely a small-sample artifact (the offending cells are all n≤5).

---

## 3. The health-system IT-leader lens — what's credible, what isn't

**Credible today (would survive a comp-committee conversation):**
- Application Analyst ≈ **$100k** national; Entry **$88k** → Mid **$96k** → Senior **$117k**. Clean, large-sample, matches market.
- Manager **$132k**, Director **$182k**, the leadership ladder up to Chief **$321k**.
- Directional **module premiums**: Willow / Cupid / Cogito / Interface run hot; HIM / Ambulatory / Resolute-HB run lower. That ranking matches how these teams actually pay.

**Not credible (a leader will not defend these):**
- Any chart where **Senior < Mid** (Bridges, Cupid) or **Entry = Mid** (Cogito).
- A **"Principal / Architect"** marker — we have almost no L4 data (Analyst L4 = 15 postings, 0 reported; most modules zero). Showing it overpromises.
- Specific cells dragged by outliers (HIM, MyChart) or templated postings ($101,400 cluster).

The bar for this audience is "a number I can put in front of a CFO." Jagged per-cell medians fail that bar even though the family numbers pass it easily.

---

## 4. The fix — a better way to display (even at low n)

Real compensation surveys never publish a raw median of n=4. They **decompose into two well-sampled signals and recombine** — and we have exactly those two signals:

**Signal A — the career-ladder *shape* (well-sampled).**
Application Analyst L1→L3 is n=89/305/108. That defines the step multipliers off the family median ($100.5k):
Entry ≈ 0.88× · Mid ≈ 0.96× · Senior ≈ 1.17× · Lead/Principal ≈ 1.25× (modeled). Enforce monotonicity (isotonic / cumulative-max) so it never inverts.

**Signal B — the module *premium* (poolable).**
Each module's median pooled **across** levels (n≈15–25 after pooling, vs 3–5 per cell) gives a stable "this app pays X% vs the analyst average," after an outlier/dup trim. e.g., Willow +10–15%, HIM −8–10%.

**Recombine → a smooth, always-monotonic, honest ladder:**
`module level value = family median × module premium × level multiplier`
This gives every module a clean Entry→Senior progression scaled to its real pay level — and it can never produce senior<mid. Label it **"modeled from the analyst ladder where module samples are thin,"** and where a module *does* have real depth at a level (n≥~12), mark that point as measured (solid) vs modeled (light).

**Concretely, the redesigned section becomes:**
1. **One Epic-analyst career ladder** — Entry/Mid/Senior/Principal on the solid family data (the "levels within a range," done once, trustworthy).
2. **Module premium index** — a ranked bar: "what each Epic application pays vs the analyst average," only for modules with enough pooled n; the rest grouped as *limited data* rather than shown as fake precision.
3. **Per-module modeled ladder (optional)** — ladder × premium, flagged modeled, with measured points highlighted.

This is more creative *and* more defensible than the current grid — it stops pretending we have module×level resolution we don't, and shows the two real signals cleanly.

---

## 5. Where we need more data (prioritized)

1. **Reported pay by module — the #1 gap.** Today: zero. The give-to-get contribution form now asks Epic module + level, so every unlock fills this. Prioritize driving contributions; this is what turns the modeled ladders into measured ones.
2. **Depth per (module × level)** — target ≥12–15 each; today most are 3–5. Highest-value modules to deepen: **Willow, Cupid, Cogito, Beaker, Resolute (HB/PB), Bridges/Interface**.
3. **Senior & Lead/Principal/Architect (L3–L4)** — thin everywhere; the top of every ladder is modeled.
4. **Empty modules** — ~10 of 26 have essentially no data: **OpTime, Stork, ASAP, Kaleidoscope, Care Everywhere, Cheers, Orders, Grand Central, Prelude, PB Claims**. Add targeted scrape terms + solicit contributions.
5. **Thin families** — INT (28), SEC (14), BI (22) are directional only; SEC L1 (n=3, $55k) is noise. Don't break these to module×level yet.
6. **Posted-side cleanup** — apply the same IQR trim + duplicate-posting dedup to postings that we apply to reported pay (kills the $101,400 cluster and the $31k/$42k floors).
7. **Leadership-by-module** (Dir·module, Mgr·module) — all n=3–22, mostly noise; **drop module-level leadership** until there's depth.

---

## 6. Recommendation

- **Display:** rebuild the module section as **career-ladder + module-premium index** (with the optional modeled per-module ladder), replacing the raw module×level grid. Monotonic by construction, honest about confidence.
- **Data:** run a posted-side outlier/dup trim now; lean on the contribution flywheel for module-level reported pay; broaden scrape terms for the ~10 empty modules.
- **Confidence:** keep the direct/blended/modeled tiering, and visibly mark modeled vs measured points so a leader knows exactly which numbers are firm.

---

## 7. Decisions taken (June 20, 2026)

- **Dropped the per-application (module) breakdown** from the live view until each module reaches critical mass. It was the only credible move — thin posted cells can't carry a per-module ladder.
- **Focus the IC view on the Application Analyst career ladder:** Entry (measured $88k) · Mid (measured $96k) · Senior (measured $117k) · **Principal / Lead (modeled ~$132k)** · **Application Architect (modeled ~$155k)**. The top two rungs are flagged *modeled* and fill in as senior contributions arrive.
- **Credential premium is now a first-class signal (validated on the scrape).** Within Willow/pharmacy build roles, those requiring a **PharmD/RPh run $144,326 median (p25–p75 $128k–$166k) vs $111,850 non-licensed — a +$32k / +29% premium** (n=10 vs 30; any-PharmD/RPh-tagged role = $148,250, n=25). The hiring.cafe v5 export exposes this via structured `licenses_or_certifications` + doctorate-degree fields (descriptions are empty, so credential must come from those fields, not free text).
  - **Display:** shown as a "a clinical license resets the ladder" callout under the analyst ladder.
  - **Capture:** added a *clinical license* field (PharmD/RPh, RN/BSN, RHIA/RHIT, MD/DO, None) to the contribution form, and the classifier should read `licenses_or_certifications`/degree fields from postings. Same premium pattern expected for RN (clinical modules) and RHIA/RHIT (HIM).
  - **To productionize:** add a `credential` dimension to `comp_observations` / `benchmark_published` so "licensed vs standard" becomes a real cut (today the $144k/$112k figures are computed from the scrape, not yet stored as benchmark rows).
