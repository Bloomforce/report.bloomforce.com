# Bloomforce Insights 2.0
### From an annual report to a living market-intelligence product

**Prepared for:** Zach, Bloomforce
**Date:** June 17, 2026
**Goal:** Turn `report.bloomforce.com` from a once-a-year drop into an always-on, continuously updated source of healthcare-IT talent intelligence — better UX/UI, and a data engine that keeps it alive.

---

## The one-line thesis

Today's report is excellent — but it's an *archive the moment it ships*. Every part of it says "2025, surveyed Nov '24–Jan '25." The fix isn't a redesign first; it's moving the data out of code and into a layer the report reads from continuously. Once the data can move, the design can show it moving — and that is what turns a report into a destination people return to (and a lead engine that runs all year instead of one week a year).

---

## 1. Audit of the current report

**What's working — keep it.**

The 2025 report is genuinely strong. It's professional, on-brand, and credible. The visual hierarchy is clean, the Salary Explorer is real interactivity (role selector, distribution, gender breakdown), and the animated stat counters give it momentum. The lead-gen architecture is disciplined — "Book a Call," "Request Full Report," and the "No pitch. Just data." voice all reinforce the staffing business without feeling pushy. Methodology transparency (sample size, dates, demographics) earns trust. None of this should be thrown away.

**Where it blocks the "living" goal.**

1. **It's anchored to a single point in time.** The title, framing, and methodology all fix it to one survey window. It reads as a publication, not a product.
2. **Snapshots, not trends.** Almost every figure is a single current value. The few comparisons that exist (work-life balance 84% vs. 72% in 2023) hint at how powerful direction is — but it isn't systematic, and there's no time-series anywhere.
3. **No freshness signals.** Nothing tells a returning visitor that anything changed. No "updated" timestamps, no recency, no movement.
4. **The data is hardcoded — this is the real blocker.** Updating any number almost certainly means a developer editing components and redeploying. *This is the actual reason it's annual.* Until the data lives in a database the team can update, "living" is impossible no matter how good the design is.
5. **No reason to come back.** There's no subscribe, no alert, no fresh layer between annual drops.
6. **Gating limits the "destination" feel.** Walling the richest cuts behind "Request Full Report" is fine for leads, but a living destination needs enough always-open value to earn repeat traffic. Gate the *personalized/premium* layer instead of the core benchmark.
7. **Single-page IA won't scale.** As data deepens (regions, segments, quarters), one long scroll strains. It needs room to become a hub.

---

## 2. The "living" engine — designing the data mix

You picked rolling survey + external market data, and asked me to design the mix. Here's the model I recommend: **three layers, each at a different velocity and a different level of authority.** Together they guarantee there's always something fresh to show, while keeping a credible benchmark spine.

| Layer | Source | Velocity | Role | Trust |
|---|---|---|---|---|
| **1 — Benchmark spine** | Your survey (the 2026 survey is already live) | Recomputed continuously on a rolling 12-month window | The citable salary/sentiment benchmarks. The thing people quote. | Highest — survey-grade |
| **2 — Market pulse** | External job postings + industry news (Epic go-lives, M&A, health-system hiring) | Weekly, automated | "What's moving now" — demand, posted ranges, remote share, emerging AI roles. The reason to return. | Directional |
| **3 — Insider signal** | Your own anonymized placement / open-req data | Monthly | "What we're actually seeing in the market." Uniquely yours; it's the authority that drives the sales conversation. | Proprietary, high-trust |

**Why this works:** the survey alone can't feel "live" — 300+ responses a year is lumpy, maybe ~25/month, not enough to move every cut daily. Layer 2 moves weekly on its own, so the product is never stale even when the survey is quiet. Layer 3 costs nothing to collect (it's a byproduct of your business) and is the most credible signal you have. The survey stays the spine because it's the part people cite.

**Handling small samples honestly:** roll on a trailing 12-month window, only update a cut when its N crosses a threshold, and show N and "last updated" on every number. Transparency about freshness *is* the product.

**Job postings carry double duty.** Layer 2 isn't just a data feed — it's also the engine behind your best lead-gen asset (the Job Posting Analyzer, §5). The same n8n flow that ingests postings for the "market pulse" also parses a *single* posting a hiring manager submits, so one pipeline powers both the always-fresh content and the conversion tool. Worth building well.

**Start with Layers 1 + 2** (what you selected). **Add Layer 3 next** — it's your moat and it's free.

---

## 3. Recommended build — and you already own every piece

You asked me to recommend the stack. The strong recommendation is to **keep the Next.js front end and add a data layer behind it** — not rebuild, not move to Webflow. Webflow is right for your marketing site; this is a data application and needs a database and an automation layer Webflow can't give you. The remarkable part: **every component is already connected in your workspace.**

| Need | Tool | Already connected? |
|---|---|---|
| Front end + hosting | **Next.js on Vercel** — keep the current site; use Incremental Static Regeneration so pages rebuild as data changes, no redeploys | ✅ Vercel |
| Data layer | **Supabase (Postgres)** — survey responses, ingested job postings, placement aggregates; published "cuts" as DB views the site reads | ✅ Supabase |
| Automation / ETL | **n8n** — scheduled jobs that pull job postings, normalize them, upsert to Supabase, recompute the rolling aggregates, and post a Slack note when fresh data lands | ✅ n8n |
| Survey intake | Your forms tool → webhook → n8n → Supabase (replaces the once-a-year export) | ✅ forms connector |
| Job-posting ingestion | **Firecrawl / Tavily → n8n** — scrape & parse postings (the weekly feed *and* the single URL a hiring manager submits): role, posted range, location, work model | ✅ Firecrawl, Tavily |
| Lead capture / CRM | **HubSpot** — analyzer and subscribe submissions flow straight into your pipeline as intent-rich leads | ✅ HubSpot |
| Audience + alerts | **Beehiiv / Klaviyo** — capture "track my role" emails; send the alert when a benchmark moves | ✅ both connected |
| Editorial copy | A lightweight protected `/admin` in the Next app (or MDX in-repo) so the team edits narrative without a deploy | — build |

This means 2.0 is mostly *wiring tools you already have*, not buying or learning a new stack. That's the cheapest possible path to "living."

**The core architectural move:** migrate the 2025 dataset out of the React components and into Supabase, then point the existing site at it. The day that's done, the report becomes updatable without a developer — which is the entire ballgame.

---

## 4. The redesign — a "living" design language

The prototype (`insights-2.0-prototype.html`) shows these concretely. The principles:

- **Freshness is a first-class UI element.** A persistent strip — "LIVE · 1,284 respondents · pulse refreshed 2 days ago · as of [today]." Per-metric timestamps and ▲▼ velocity arrows. The product should *look* alive.
- **Every number gets a direction.** Sparklines on headline stats; a Distribution↔Trend toggle in the Salary Explorer; a "Market in Motion" section with real time-series. This is the single biggest perceptual shift from annual to living.
- **A live respondent counter.** Ticks up as the 2026 survey collects, with an inline "add your data" CTA — turning passive readers into contributors and reinforcing the survey moat.
- **A Market Pulse feed.** Reverse-chronological, auto-generated from Layer 2: "Remote share of new App Analyst postings up 4 pts this month." This is the weekly return hook.
- **"Where do you stand?" personalization.** Expand the Salary Explorer into a benchmarking tool: enter your comp → see your percentile and a "you are here" marker. Capture email to track it → alert when it moves. (Lead gen + return loop in one.)
- **Methodology that breathes.** Live N, rolling window, layer-by-layer freshness. Honesty about recency builds more trust than a polished-but-frozen number.
- **Subscribe / alerts.** "Get notified when your role's benchmark changes." The mechanism that converts a once-a-year visit into an ongoing relationship — and a warm lead for staffing.
- **Analyst-to-CIO coverage.** The role set now spans individual contributors *and* leadership (IT Manager → Director → VP → CMIO/CNIO/CIO), with regional cost-of-market adjustment. Leadership comp is where the high-value staffing conversations are.
- **CTAs at every turn.** Each section ends in a contextual next step (analyze your posting, book a data review, subscribe) — never a dead end. See §5.
- **Dates, everywhere.** A prominent "last updated" plus per-metric and per-role timestamps. The credibility of a living product is its dating.
- **IA shift:** from one long scroll to a hub with an always-visible "as of" state and room to add segment deep-dives continuously, without another redesign.

Brand stays exactly as-is: navy `#192654`, teal `#00A896` / `#3BC3B4`. The new ingredient is a subtle "live" motion language (pulsing status dots, count-ups, animated trend lines) — alive, not flashy.

---

## 5. Lead generation — turn the data into pipeline

The whole product should pull toward one action: *start a conversation with Bloomforce.* Two mechanics do the heavy lifting.

**The Job Posting Analyzer (flagship).** A hiring manager pastes their open-role URL, confirms role / region / seniority / work-model, and optionally their budgeted max. Instantly they get the market rate for that level, a distribution with "market rate" and "your budget" markers, and plain-English flags — e.g. *"your posted max is $14k below market for a senior analyst; expect a longer time-to-fill,"* or *"an on-site requirement filters out the ~64% of candidates for this role who work fully remote."* Then the hook: **"Get the full tailored analysis + candidate availability"** → email capture → straight into HubSpot. It's the strongest top-of-funnel asset you could build, because anyone using it is, by definition, hiring *right now*.

*How it works:* the submitted URL is parsed by Firecrawl/Tavily inside an n8n flow (role, posted range, location, work model), matched to the benchmark in Supabase, and returned as the analysis. Every submission becomes a CRM record tagged with the exact role and market the manager cares about — ideal for follow-up. The prototype demos this with your selections; the live version reads the posting from the URL automatically.

**CTAs throughout.** Every section ends in a next step rather than a dead end — Salary Explorer → "Hiring for this role? Analyze your posting"; Trends → "Want this for your roles? Book a 20-min data review"; Pulse → "Get the weekly pulse + alerts" — plus the persistent "Talk to Us" in the nav and the "track your role" subscribe loop. Keep the **core benchmark open** (it earns trust and repeat traffic) and gate the **tailored layer** — personalized analysis, candidate availability, full breakdowns — behind a light email step. That trade is what converts an audience into pipeline.

**The funnel:** anonymous visitor → uses Explorer/Analyzer (value first) → submits a posting or subscribes (now a known, intent-rich contact in HubSpot) → tailored analysis + book-a-call (sales conversation). Year-round, automated, measurable.

---

## 6. Phased roadmap

**Phase 0 — Foundation (≈2 weeks).** Stand up the Supabase schema. Migrate the 2025 dataset out of code into the database. Point the existing site at it. *Outcome: the report is now updatable without a deploy — no visible change yet, but the blocker is gone.*

**Phase 1 — Living core (≈2–4 weeks).** Continuous survey intake (form → n8n → Supabase, rolling 12-mo aggregates). Expand role coverage to leadership (Manager → CIO) and add regional adjustment. Freshness UI: prominent dates, live counter, ▲▼. Trend views on headline metrics. *Outcome: the site stops saying "2025" and starts saying "current."*

**Phase 2 — Market pulse + Analyzer (≈3–4 weeks).** n8n jobs ingest job-posting + industry data weekly; the Market Pulse feed goes live. **Ship the Job Posting Analyzer v1** (paste-URL → Firecrawl/Tavily parse → instant analysis) on top of that same posting pipeline. *Outcome: fresh content every week, plus your flagship lead-gen tool.*

**Phase 3 — Conversion + alerts (≈3–4 weeks).** "Where do you stand" benchmarking. Email capture → HubSpot (analyzer + subscribe leads route to your pipeline) and Beehiiv/Klaviyo. Benchmark-change alerts. *Outcome: a return loop and a year-round lead engine.*

**Phase 4 — Insider layer + editorial (ongoing).** Anonymized placement signal (Layer 3). A short monthly "what changed" note. Quarterly segment deep-dives. *Outcome: the authority position no competitor can copy.*

**Ongoing effort:** after Phase 2, most updates are automated. The recurring human job is reviewing auto-refreshes and writing a brief monthly narrative — a few hours a month, not a once-a-year scramble.

---

## 7. How you'll know it worked

Watch return-visit rate, subscriber count, time on site, and — the one that pays for it — qualified "Talk to Us" conversions spread across the whole year instead of one launch spike. A living benchmark also compounds in organic search: one evergreen URL accruing authority beats a new report URL every year.

---

## What I'd suggest next

Two natural next steps, whenever you want them:
1. **Scaffold Phase 0** — I can draft the Supabase schema (tables for survey responses, job postings, and the published benchmark views) and a first n8n ingestion workflow, so the migration has a concrete starting point.
2. **Extend the prototype** into the real Salary Explorer 2.0 component, wired to read from the data layer.

Open the prototype to feel the direction — that's the fastest way to react to it.
