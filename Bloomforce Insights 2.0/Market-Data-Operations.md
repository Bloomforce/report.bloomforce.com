# Bloomforce Market Data Operations

## Purpose

This is the operating contract for the living market analysis. It separates source evidence, canonical records, review decisions, and public aggregates so new data can improve the benchmark without rewriting its history.

The internal dashboard is `/admin/data-operations`. It is read-only in v1 and shows permanent baseline counts, accepted continuous data, current postings, records awaiting review, source status, and recent processing runs.

## Source policy

| Source | Cohort | Retention | Benchmark eligibility |
|---|---|---|---|
| 2024 salary survey | `baseline_2024` | Permanent | Included unless hard-invalid or a major 3x-IQR outlier |
| 2025 salary survey | `baseline_2025` | Permanent | Included unless hard-invalid or a major 3x-IQR outlier |
| New website surveys | `continuous` | Permanent | Included after normalization and validation |
| Quick salary contributions | `continuous` | Permanent | Included after normalization and validation |
| Public salary records | `public_record_baseline` | Permanent | Included under source-specific quality rules |
| Job postings | `rolling_posted_12m` | Permanent raw history | Included in live calculations for 12 months |

Historical records are never deleted because they become old. Time windows are applied with `in_benchmark` and at publish time.

## Record lifecycle

1. `survey_submissions_raw` receives an immutable provider payload and payload hash.
2. The instrument registry and question map identify the form and canonical fields.
3. A PII-minimized record is written to `survey_responses`. Email is represented only by a one-way respondent hash for duplicate detection.
4. Valid records begin as `pending`.
5. The daily promotion job evaluates required fields, duplicate submissions, hard salary bounds, and conservative 3x-IQR major outliers.
6. Records become `accepted`, `review_required`, or `rejected`.
7. Accepted salary records create one `comp_observations` fact with `measure_type = base_salary`.
8. The refresh job combines eligible actual-pay observations and current posted salary midpoints, applies minimum-cell and employer-cap rules, and republishes public aggregates.

## Review rules

- Missing title, salary, role classification, or seniority: `review_required` during normalization.
- Duplicate respondent, role, and salary within 30 days: `rejected`.
- Salary outside hard role-family bounds: `rejected`.
- Salary outside conservative 3x-IQR bounds for its role family: `review_required` for new data and excluded from the historical baseline.
- Missing geography: allowed for the National benchmark only.
- Bonus and variable compensation are stored but are not mixed into the base-salary benchmark.

Rejected and review records stay in the private database with reason codes. They are never included in public aggregates.

## Canonical data dictionary

### `survey_instruments`

| Field | Meaning |
|---|---|
| `key` | Stable form/version identifier |
| `provider` | `jotform`, `bloomforce`, or `csv` |
| `provider_form_id` | Provider-side form identifier |
| `audience` | Respondent population |
| `version` | Mapping version |
| `is_full_survey` | Full survey versus quick contribution |

### `survey_submissions_raw`

| Field | Meaning |
|---|---|
| `provider_submission_id` | Idempotency key from the provider |
| `payload` | Original source evidence; private |
| `payload_sha256` | Integrity and duplicate-check hash |
| `processing_status` | `received`, `normalized`, `accepted`, `review_required`, `rejected`, or `error` |
| `processing_error` | Machine-readable reason or processing failure |

### `survey_responses`

| Field | Meaning |
|---|---|
| `role_family` | Canonical family such as `AA`, `BI`, `DIR`, or `EXEC` |
| `seniority_level` | `L1`-`L4`, `M1`-`M3`, or `exec` |
| `role_key` | Family and level, such as `AA.L3` |
| `region` | Census-style Bloomforce region; nullable for National-only use |
| `employer_type` | Canonical organization type |
| `work_model` | `remote`, `hybrid`, or `onsite` |
| `base_comp` | Annualized base salary in USD |
| `bonus_comp` | Annual bonus/variable pay; not used in base benchmark |
| `respondent_key` | One-way email hash for duplicate detection |
| `is_baseline` | True only for the permanent historical waves |
| `baseline_cohort` | `baseline_2024`, `baseline_2025`, or `continuous` |
| `status` | Review lifecycle state |
| `validation_notes` | Structured reason codes |

### `comp_observations`

| Field | Meaning |
|---|---|
| `observation_type` | `actual` or `posted` |
| `measure_type` | `base_salary` or `posted_range_midpoint` |
| `value` | Annual compensation point used in calculations |
| `benchmark_cohort` | Retention/window cohort |
| `in_benchmark` | Current eligibility flag; never a deletion signal |
| `quality_flags` | Outlier, source, or review annotations |
| `source_observed_at` | When the source evidence was observed |

### Published surfaces

`benchmark_published`, `demand_published`, `pulse_published`, `sentiment_published`, and `freshness_published` contain aggregated, suppressed public data only. Private source rows are not exposed to anonymous clients.

## Automation

- Vercel calls `/api/cron/insights-refresh` daily.
- The job first promotes pending survey responses, then republishes the benchmark, demand shares, pulse, and freshness metadata.
- Manual equivalent: `npm run data:refresh`.
- Every promotion and refresh writes an `ingest_runs` record.

## Configuration

Required Vercel variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `JOTFORM_WEBHOOK_SECRET`
- `INSIGHTS_ADMIN_USER`
- `INSIGHTS_ADMIN_PASSWORD`

Configure each Jotform webhook as:

`https://report.bloomforce.com/api/insights/survey-ingest/jotform?key=JOTFORM_WEBHOOK_SECRET`

The secret value must match the Vercel environment variable. The endpoint is idempotent by Jotform submission ID.

## BloomOS integration boundary

BloomOS should consume account-safe analytical outputs, not raw survey payloads. The next integration layer should expose:

- account-to-employer aliases and canonical account IDs;
- like-role salary ranges by role family, level, region, work model, and employer type;
- account-specific observed pay where the evidence is attributable and permitted;
- demand index and change over time;
- confidence, sample size, provenance class, and freshness with every insight.

Raw respondent data and source payloads remain in the Workforce Data project.
