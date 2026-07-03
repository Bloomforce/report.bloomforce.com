# hiring.cafe → Apify — target keywords & filtered-URL plan

**Goal:** pull the last 12 months of Epic / healthcare-IT postings from hiring.cafe via Apify, into the separate Insights DB (`raw_jobs`, `source='apify_hiringcafe'`).

---

## What I confirmed on the live site

- hiring.cafe has a **Date-posted** filter (defaults to "3 months" — see note below) and a **"Job Titles & Keywords"** filter, plus location and workplace-type.
- It's a single-page app that stores search state **in the URL**, so a filtered search produces a shareable URL — exactly what an Apify "start URLs" actor wants.
- The browser tooling dropped connection before I could copy the exact URL encoding. The capture step below gets it in ~30 seconds; paste me one and I'll generate the entire list.

⚠️ **Date-range check:** the date control showed "3 months." Confirm it offers **12 months / 1 year**. If 3 months is the max, we either (a) run the scrape on a schedule going forward and accumulate, or (b) let Apify paginate *all* results and filter to 12 months after the fact. Tell me what options you see and I'll adapt.

---

## Capture the URL template (30 seconds, in your own browser)

1. Go to **hiring.cafe**.
2. Set **Date posted → 12 months** (or the max available), **Location → United States**.
3. In **Job Titles & Keywords**, type one term, e.g. **Epic Application Analyst**.
4. Copy the URL from the address bar and paste it to me.

From that single URL I'll reverse the encoding and produce the **full list below as ready-to-paste Apify URLs** — same date + location filters baked in, one per keyword.

---

## Target keywords (the role list, ready to slot in)

Two ways to run it — I recommend doing **both**: the broad catch-alls for coverage, plus the module-specific terms for depth/quotas.

### A. Broad catch-alls (2 URLs — highest coverage, classify after)
- `Epic`
- `Epic Analyst`

### B. Module-specific build/analyst roles (the "specific roles")
- `Epic Willow` (Pharmacy)
- `Epic Beaker` (Lab)
- `Epic Cadence` (Scheduling)
- `Epic Prelude` (Registration)
- `Epic Grand Central`
- `Epic Resolute Hospital Billing`
- `Epic Resolute Professional Billing`
- `Epic HIM` / `Epic Health Information Management`
- `Epic ClinDoc`
- `Epic ASAP`
- `Epic OpTime`
- `Epic Stork`
- `Epic Cupid`
- `Epic Radiant`
- `Epic Beacon`
- `Epic Ambulatory`
- `Epic MyChart`
- `Epic Tapestry`
- `Epic Healthy Planet`
- `Epic Care Everywhere`

### C. Technical / specialty IC
- `Epic Bridges` / `Epic Interface Analyst`
- `Epic Cogito` / `Epic Clarity` / `Epic Business Intelligence Developer`
- `Epic Security Analyst`
- `Epic Client Systems` / `Epic ECSA`
- `Epic Application Coordinator`

### D. Training
- `Epic Principal Trainer`
- `Epic Credentialed Trainer`

### E. Management / leadership
- `Epic Application Manager`
- `Epic Project Manager`
- `Epic Program Manager`
- `Director Epic Applications`
- `Epic Clinical Informatics`

> ~35 terms. If your Apify actor takes a **keyword list** as structured input rather than URLs, skip the URL templating — paste this list straight in (one search per term), with `date posted = 12 months`, `location = United States`.

---

## Apify run notes

- **Dedup:** the broad `Epic` search overlaps the module terms — de-dupe on job URL / `fingerprint` at load time (the Insights schema already has a `fingerprint` column + index).
- **Field mapping → `raw_jobs`:** title→`job_title`, company→`company`, location→`location` (+ parse `state`), workplace→`workplace_type`, salary→`yearly_min/max_comp` or `hourly_min/max_comp`, posted date→`posted_date`, url→`job_url`, full record→`raw` (jsonb). Set `source='apify_hiringcafe'`.
- **Volume:** hiring.cafe lists ~3.5M jobs total; an `Epic` + US + 12-month filter should return a manageable few-thousand — good for a first full load.
- **Cadence:** first run = 12-month backfill; then schedule weekly incremental via n8n.

---

## Next

Paste me **one** captured filtered URL (step above) **or** tell me your Apify actor takes a keyword list, and I'll deliver the finished, ready-to-run target set.
