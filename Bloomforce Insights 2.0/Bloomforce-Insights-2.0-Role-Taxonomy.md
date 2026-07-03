# Bloomforce Insights 2.0 — Epic Role Taxonomy (draft v1)
### A precise, defensible role list to benchmark against

**Date:** June 17, 2026
**Grounded in:** BloomOS `epic_module_taxonomy` (26 modules) + the real titles in `public.jobs`
**Status:** v1 **locked** June 17, 2026 (granularity, seniority, and scope decided — see §E)

---

## Principle: a "specific role" has three parts

> **Role Family × Epic Module (where it applies) × Seniority**

Benchmark at the most specific level the data supports; roll up to family × seniority, then family, when a cell is thin. Example fully-specified roles:

- *Epic **Willow** Application Analyst — **Senior** (L3)*
- *Epic **Beaker** Application Analyst — **L2***
- *Epic **Cogito/Clarity** BI Developer — **L3***
- *Epic **Resolute HB** Application Analyst — **Principal** (L4)*
- *Epic **Bridges** Interface Analyst — **L2***
- *Epic Principal Trainer (build) — **L3***
- *Director, Epic Clinical Applications — **M2***
- *CMIO — **Exec***

---

## A. Role families (the core list)

| Code | Role family | What they do | Real titles in your data | Module-specific? |
|---|---|---|---|---|
| AA | **Application Analyst** | Build/configure an Epic app | "Epic Application Analyst", "Applications Analyst II – Ambulatory", "Epic Analyst – Professional Billing", "Epic Clinical Analyst" | ✅ yes |
| AC | **Application Coordinator / Lead Analyst** | Owns a module's build; leads analysts | "IS Epic Application Coordinator", "Advanced Application Analyst – Beaker" | ✅ yes |
| INT | **Interface / Integration Analyst** | Bridges, Care Everywhere, HL7/FHIR | "Epic Interface Analyst II", "Care Everywhere Applications Analyst II" | ✅ (integration) |
| BI | **Reporting / BI Developer (Cogito)** | Clarity, Caboodle, SlicerDicer, Radar | "Epic Business Intelligence Developer" | ◑ (Cogito) |
| SEC | **Security / Identity Analyst** | Epic security, provisioning, access | "Epic Security Analyst II", "Epic Security Business Analyst II" | ◑ |
| TECH | **Technical / Client Systems (ECSA)** | Chronicles/Caché, environments, Hyperspace, Cogito DBA | (thin in current data) | ◑ |
| PT | **Principal Trainer** | Builds training env + curriculum | "Epic Principal Trainer" | ✖ |
| CT | **Credentialed Trainer** | Classroom / go-live training | (classroom trainer titles) | ✖ |
| PM | **Project / Program Manager** | Epic implementations, PMO | "Manager Application Implementation" | ✖ |
| MGR | **Applications / IT Manager** | Manages a build team | "Applications Manager", "Manager – Epic Technical", "Epic Manager Revenue Cycle" | ◑ (by area) |
| DIR | **Director / Executive Director** | Owns Epic/clinical apps or program | "Director – Epic Clinical Applications", "Executive Director – Epic Program" | ◑ (by area) |
| VP | **VP / AVP of IT** | IT leadership | (thin; use 990 + placements) | ✖ |
| EXEC | **CIO / CMIO / CNIO / CHIO** | Executive informatics | (rare in postings; use IRS 990) | ✖ |
| CI | **Clinical Informatics Specialist/Analyst** | Clinical SME bridge (RN/PharmD/MD informaticist) | "Manager Pharmacy Informatics" | ◑ |

---

## B. Explicit exclusions (drop from the benchmark)

These are polluting `is_epic_relevant` today — pure clinical/operational roles that *mention* Epic but aren't Epic IT. Filter them out:

> Medical Assistant · Registered Nurse (bedside) · Physician (clinical) · Pharmacy Technician · Dental Assistant / Hygienist · Scheduling Coordinator · Referral Coordinator · Business Office Representative · Practice Manager · Revenue Integrity **Coder** (unless Epic build)

(Real examples seen: "medical assistant" ×7, "pharmacy technician", "registered nurse", "dental hygienist", "revenue integrity corp coding analyst ii".)

---

## C. Epic module dimension (your 26 modules, grouped)

| Module family | Modules |
|---|---|
| **Clinical** | Willow (Pharmacy), Beaker (Lab), ClinDoc, Orders, ASAP (ED), OpTime (Surgical), Stork (OB), Cupid (Cardiology), Radiant (Radiology), Beacon (Oncology), Kaleidoscope (Ophthalmology), Ambulatory |
| **Access** | Cadence (Scheduling), Prelude (Registration), Grand Central (Patient flow) |
| **Revenue Cycle** | Resolute HB, Resolute PB, PB Claims, HIM / Coding |
| **Analytics** | Cogito (Clarity / Caboodle / SlicerDicer / Radar) |
| **Integration** | Bridges / Interfaces, Care Everywhere |
| **Patient Engagement** | MyChart, Cheers (CRM) |
| **Population Health** | Healthy Planet |
| **Managed Care** | Tapestry |

Module applies primarily to **AA, AC, INT, BI** and, by area, to **MGR/DIR**. It does **not** apply to trainers, PMs, or execs.

---

## D. Seniority ladder (normalize the messy titles to one scale)

| Level | Maps from | 
|---|---|
| **L1** Associate / Analyst I | "associate", "analyst i", "junior", "jr", "entry" |
| **L2** Analyst II | "analyst ii", "analyst" (no modifier) |
| **L3** Senior / Analyst III | "senior", "sr", "analyst iii", "advanced" |
| **L4** Principal / Lead / Analyst IV | "principal", "lead", "analyst iv", "coordinator" |
| **M1** Manager | "manager", "supervisor" |
| **M2** Director | "director", "executive director", "head of" |
| **M3** VP / AVP | "vp", "vice president", "avp" |
| **Exec** | "cio", "cmio", "cnio", "chio", "chief" |

---

## E. Locked decisions (per your call, June 17, 2026)

- **Granularity — module-level for build roles.** **AA, AC, INT, BI** (and MGR/DIR by area) are benchmarked **× Epic module**; trainers, PMs, technical, and execs stay at family level. Roll up module → family × seniority → family when a cell is thin, and always show the level + confidence a number came from. *This is the differentiation — nobody else publishes "Epic Beaker Analyst, Senior."*
- **Seniority — standard ladder.** L1–L4 · M1 Manager · M2 Director · M3 VP · Exec. All title variants (II/III/IV, Sr, Principal, Lead, Advanced, Coordinator, Associate) normalize to it.
- **In scope:** the core build / analyst / coordinator / interface / BI / trainer / PM / management families **plus Clinical Informatics (CI) and Epic Technical/Infrastructure (TECH)**.
- **Out of scope (for now):** non-Epic EHRs (Oracle Health/Cerner, Meditech) and consulting/contract bill-rate roles — easy to add later.
- **Canonical role key:** `family[.module].level` — e.g. `AA.willow.L3`, `BI.cogito.L3`, `INT.bridges.L2`, `DIR.revenue_cycle.M2`, `CI..L2`, `EXEC..cmio`.

The rules that assign these keys, and the plan to broaden coverage per role, are in the companion **Classification & Scrape-Scope Spec**.
