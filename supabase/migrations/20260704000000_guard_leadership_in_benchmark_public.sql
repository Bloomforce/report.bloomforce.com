-- Director, VP, and C-suite benchmarks are call-only: excluded from the anon
-- surface entirely. Manager (M1) stays public. Base table keeps all rows for
-- service-role use (Tier-3 / data reviews).
create or replace view public.benchmark_public as
select role_key, role_family, module, seniority_level, region, work_model,
       employer_type, credential, period, n_observations,
       blended_p10, blended_p25, blended_median, blended_p75, blended_p90,
       remote_share, confidence_tier, median_delta_90d, spark, updated_at
from public.benchmark_published
where role_family not in ('DIR','VP','EXEC')
  and seniority_level not in ('M2','M3','exec');
