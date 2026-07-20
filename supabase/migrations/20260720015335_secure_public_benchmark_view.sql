-- Make the public view honor caller permissions while exposing only the
-- aggregate columns already present in benchmark_public.
alter view public.benchmark_public set (security_invoker = true);

drop policy if exists "public read safe benchmark cuts"
  on public.benchmark_published;
create policy "public read safe benchmark cuts"
  on public.benchmark_published
  for select
  to anon, authenticated
  using (
    role_family not in ('DIR', 'VP', 'EXEC')
    and seniority_level not in ('M2', 'M3', 'exec')
  );

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
