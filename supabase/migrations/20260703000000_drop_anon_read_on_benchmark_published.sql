-- Cutover: the site now reads the blend-only benchmark_public view.
-- The base table (which carries actual/posted split columns) is service-role only.
drop policy if exists "public read benchmark" on public.benchmark_published;
