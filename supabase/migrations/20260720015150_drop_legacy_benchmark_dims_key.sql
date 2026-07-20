-- Superseded by benchmark_published_cut_key, which also includes credential.
alter table public.benchmark_published
  drop constraint if exists benchmark_published_dims_key;
