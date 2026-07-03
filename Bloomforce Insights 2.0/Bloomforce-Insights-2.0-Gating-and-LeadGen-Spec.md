# Bloomforce Insights 2.0 — Gating & Lead-Gen Spec
### The three-tier funnel: free blended benchmark → soft-gated competitive view → book-a-call

**Date:** June 18, 2026
**Status:** prototype ships the *experience* (demo code `246810`); this is what makes it real.

---

## The funnel (decided)

| Tier | What they see | The ask | Purpose |
|---|---|---|---|
| **0 · Public** | One **blended** market rate per role (real pay + postings, in a single number). Work-model, employer-type, and module breakdowns. Market detail for Application Analyst. | none | Trust magnet, top of funnel |
| **1 · Soft-gated (give-to-get)** | The **competitive view** — sourced salary vs posted jobs side-by-side, open-role demand, and the posted-vs-actual gap. | **contribute your own comp** (anonymous) → **unlocks instantly**; we email a code for return visits | Grows the proprietary dataset *and* captures a rich, verified lead |
| **2 · Call-only** | **Which employers** are competing for the role (named) + a **tailored read on their req** (where the offer lands, time-to-fill, how to win it). | book 20 min | The conversation that converts |

**Voice:** warm, unnamed. No "specialist" / "our team." The boutique flex line — *"you'll talk to the person who actually works this market, not a hand-off"* — is the differentiator. The polished data product carries the credibility; the human carries the warmth.

**Integrity rule:** never tease candidate availability we don't have. The call-only promise is *market intel + advice + named competition* (all real), and sourcing surfaces honestly on the call.

---

## Why a tiny backend is required

The prototype is a static page, so today the gated data sits in the page source and the "code" is client-side — fine for a demo, **not real protection.** To actually gate it:

1. **Split public vs gated data.** Anon (publishable key) may read **only the blended figure**; the posted/actual breakdown and competitive detail must be service-role-only and served through a function after the code checks out.
2. **A request-access + code flow** that creates the lead, emails a code, and validates it server-side.

Everything below is in your existing stack: **Supabase** (Edge Functions + Postgres), **Klaviyo** (email), **HubSpot** (CRM).

---

## Data model changes (Workforce Data project)

**Expose only the blend to the public.** Add a public-safe column and tighten what anon sees:

```sql
-- one number the public is allowed to see
alter table public.benchmark_published
  add column if not exists blended_p25 numeric,
  add column if not exists blended_median numeric,
  add column if not exists blended_p75 numeric,
  add column if not exists blended_p10 numeric,
  add column if not exists blended_p90 numeric;
-- (publish step fills these = the weighted blend of posted + actual)

-- public view that EXCLUDES posted_/actual_ split + n_posted/n_actual + demand
create or replace view public.benchmark_public as
  select role_key, role_family, module, seniority_level, region, work_model, employer_type,
         period, blended_p10, blended_p25, blended_median, blended_p75, blended_p90,
         remote_share, confidence_tier
  from public.benchmark_published;
grant select on public.benchmark_public to anon;
-- revoke anon read on benchmark_published itself; the prototype switches to benchmark_public
```

**Access codes table** (service-role only):

```sql
create table if not exists public.access_codes (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  code        text not null,            -- 6 digits
  company     text,
  first_name  text,
  role_interest text,
  created_at  timestamptz default now(),
  expires_at  timestamptz default now() + interval '45 days',
  used_count  int default 0,
  hubspot_id  text
);
create index on public.access_codes (email);
alter table public.access_codes enable row level security;  -- no anon policy = service-role only
```

---

## Edge Function A — `contribute-and-access` (POST)

Called on contribution submit (own comp). Soft-unlock returns `{ok:true}` immediately so the UI reveals the competitive view; the data point, lead, and email happen server-side.

Payload: `{ role_family, seniority_level, module?, employer_type, region, base_comp, bonus_comp?, work_model?, email }`.

1. **Validate the contribution** — required fields present; `base_comp` within the per-family plausible band (reuse the survey bands: IC 40–300k, leadership 60–700k); email format + disposable-domain block.
2. **Insert the data point** into `survey_responses` with `source='web_contribution'`, `status='pending'`, `verified=false`. **Pending data does not move the public number yet** (see quarantine below).
3. **HubSpot** — upsert contact (`manage_crm_objects`): email, `role_interest=role_family`, `seniority`, `employer_type`, `region`, `lifecyclestage=lead`, `lead_source="Insights contribution"`. The contribution itself makes this a far richer lead than an email.
4. Generate 6-digit `code`; insert into `access_codes` (with `hubspot_id`, `survey_response_id`).
5. **Klaviyo** — fire event `Contributed & Requested Access` with `{code, role_interest}`; a Klaviyo flow sends the "here's your code" email (and can start nurture).
6. Return `{ ok:true }` (never return the code — it goes only to email).

### Contribution quarantine → promote (protects the benchmark)

Give-to-get invites people to type junk to get past the gate, so contributions are quarantined and cleaned with the **same rules every other data point passes** before they touch the published number:

```sql
alter table public.survey_responses
  add column if not exists status   text default 'pending',   -- pending | accepted | rejected
  add column if not exists verified boolean default false,
  add column if not exists source   text default 'survey';    -- survey | web_contribution
```

A nightly n8n job promotes the good ones:
- drop non-Epic / out-of-band / duplicates (same email+role+base within 30 days),
- per-family 1.5×IQR outlier check (the rule we already use),
- set `status='accepted'`, copy into `comp_observations` (`observation_type='actual'`, `source='web_contribution'`),
- republish `benchmark_published` (and re-apply the per-employer cap).

Net: a contribution **unlocks access instantly**, but only **moves the public number after it clears cleaning** — the flywheel grows the data without ever letting the gate pollute it.

## Edge Function B — `unlock-competitive` (POST `{email, code}`)

For return visits / the "Already have a code?" path, and to serve the protected data.

1. Look up `access_codes` by email+code, not expired → else `401`.
2. `used_count++`.
3. Return the **gated dataset** for the requested role(s): posted vs actual split, `n_posted`/`n_actual`, `demand_count`, the gap — read with the service role from `benchmark_published`. Optionally issue a signed, short-lived JWT/cookie so the page can re-fetch within the session without re-entering the code.

> Named-employer competition and req-level analysis are **not** in this payload — those are the call-only tier, surfaced by a human.

---

## Edge Function C — `analyze-req` (POST `{ url?, description?, email }`)

Powers the "send us your open role" analyzer. The visitor pastes a **job-posting URL or the description** and we parse it — they don't type fields in.

1. **Validate input** — require `url` or `description`, plus a valid email.
2. **If URL — fetch safely (SSRF guardrails, mandatory).** https only; resolve the host and **block private / internal / metadata IPs** (`169.254.169.254`, `10/8`, `172.16/12`, `192.168/16`, `localhost`); cap redirects + response size. Fetch through **Firecrawl/Tavily** (managed, sandboxed) rather than raw `fetch`; optionally allowlist common ATS/job-board hosts (workday, icims, greenhouse, lever, taleo, hiring.cafe, linkedin, indeed) plus the submitter's email domain. If the page is gated/empty, return a hint to paste the description.
3. **If description — skip the fetch** (no SSRF surface) and use the text directly.
4. **Classify** the parsed text with the same rules pipeline as postings → role family, module, seniority, posted comp (if stated), employer type, market; match to `benchmark_published` for the tailored read.
5. **HubSpot** — create/update the lead with the **parsed req attached** (role, level, market, URL/excerpt). Extremely high intent — they have an open req *now*. `lead_source="Insights analyzer"`, `intent="hiring"`.
6. **Queue outreach** — notify the Bloomforce inbox / start the tailored-analysis task or Klaviyo flow. The full read is delivered by a human (the call-only tier) — the analyzer is a *capture*, not a giveaway.
7. Return `{ ok:true }`; the page shows the warm "we'll reach out" confirmation (no instant number, by design).

**Security:** treat the URL and any scraped/pasted content as **untrusted** — never execute it, never reflect it unescaped, and store the raw payload separately from the parsed fields. This is the one place a user hands us an arbitrary URL, so the SSRF checks are non-negotiable.

> **Gate code mechanism:** per the latest decision, the Tier-1 access code uses **Supabase Auth email OTP** (passwordless 6-digit) rather than the DIY `access_codes` table + Klaviyo-sent code. Supabase Auth generates/sends/verifies the code and gives a verified session; Klaviyo is retained for *nurture* only; HubSpot still gets the lead. (Functions A/B can be simplified accordingly — happy to rewrite that section in full.)

---

## Front-end wiring (replaces the demo stubs)

- Public page reads `benchmark_public` (blend only).
- Form submit → `POST /functions/v1/request-access` → on `{ok}` reveal `#cmpBody` (the soft unlock already built).
- Competitive data → `POST /functions/v1/unlock-competitive` (session token) rather than the in-page `ROWS`.
- "Already have a code?" → same endpoint with the emailed code.

In the prototype these are stubbed: the form reveals the view locally and shows demo code `246810`. Swap the two `fetch`es in and it's live.

---

## Conversion & hygiene notes

- **Soft unlock chosen** (vs hard wall): unlock in-session, email the code for return — keeps the lead from dropping at "go check your email," still verifies via deliverability + nurture.
- **Rate-limit** `request-access` per IP/email; expire codes (45 days); codes are shareable by design (each request is still a captured lead).
- **HubSpot is the system of record** for the lead; Klaviyo handles the code email + nurture; a booked call (Calendly/Chili Piper) is the tier-2 conversion event to write back to HubSpot.
- **Tease, don't fake:** the public page can surface the *gap* as bait ("postings advertise X; people make Y — see the competitive picture →") to pull users toward Tier 1.
