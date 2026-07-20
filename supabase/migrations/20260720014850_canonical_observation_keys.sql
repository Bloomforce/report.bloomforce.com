-- Idempotency keys for rebuilding the canonical fact layer from retained
-- source evidence. PostgreSQL unique constraints allow multiple nulls.
alter table public.comp_observations
  add constraint comp_observations_raw_job_unique unique (raw_job_id);

alter table public.comp_observations
  add constraint comp_observations_source_external_unique unique (source, external_ref);
