-- Module-specific salary cuts share the role key with the all-module cut, so
-- module must participate in the publishing/upsert identity.
drop index if exists public.benchmark_published_cut_key;

create unique index benchmark_published_cut_key
  on public.benchmark_published
    (role_key, module, region, work_model, employer_type, credential, period);

create index if not exists benchmark_published_module_role_idx
  on public.benchmark_published (module, role_family)
  where module <> 'all';

create index if not exists comp_observations_module_role_idx
  on public.comp_observations (module, role_family)
  where module is not null;
