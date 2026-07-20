revoke all on public.benchmark_published from anon, authenticated;

grant select (
  role_key,
  role_family,
  module,
  seniority_level,
  region,
  work_model,
  employer_type,
  credential,
  period,
  n_observations,
  blended_p10,
  blended_p25,
  blended_median,
  blended_p75,
  blended_p90,
  remote_share,
  confidence_tier,
  median_delta_90d,
  spark,
  updated_at
) on public.benchmark_published to anon, authenticated;
