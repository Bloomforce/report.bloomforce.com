import fs from 'node:fs';
import path from 'node:path';
import { classifyTitle, levelFromV5Seniority, roleKey, type Classification } from '../lib/classify';
import { normalizeWorkModel, stateToCode, stateToRegion } from '../lib/normalize';

export interface JobRecord {
  source_job_id: string;
  fingerprint: string;
  job_title: string;
  company: string | null;
  state: string | null;
  region: string | null;
  workplace_type: string | null;
  yearly_min_comp: number | null;
  yearly_max_comp: number | null;
  hourly_min_comp: number | null;
  hourly_max_comp: number | null;
  posted_date: string | null;
  job_url: string | null;
  is_contractish: boolean;
  classification: Classification & { level: string | null };
  raw: Record<string, unknown>;
}

export function loadJobs(dir: string): JobRecord[] {
  const byFingerprint = new Map<string, JobRecord>();
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();

  for (const file of files) {
    const data: any[] = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    for (const r of data) {
      if (r.is_expired) continue;
      const v5 = r.v5_processed_job_data ?? {};
      const title: string = v5.core_job_title ?? r.job_information?.title ?? '';
      if (!title) continue;
      const company: string | null = v5.company_name ?? null;
      const stateRaw: string | null = (v5.workplace_states ?? [])[0] ?? null;
      const state = stateToCode(stateRaw);
      const posted: string | null = v5.estimated_publish_date ? v5.estimated_publish_date.slice(0, 10) : null;
      const commitment: string[] = v5.commitment ?? [];
      const isContractish = commitment.some((c) => ['Contract', 'Temporary', 'Internship', 'Volunteer', 'Seasonal'].includes(c));

      const context = [v5.job_category, (v5.technical_tools ?? []).join(' '), (v5.licenses_or_certifications ?? []).join(' '), company ?? ''].join(' ');
      const cls = classifyTitle(title, context);
      if (cls.family && !cls.level) cls.level = levelFromV5Seniority(v5.seniority_level);

      const fingerprint = [title, company ?? '', state ?? '', posted ?? ''].join('|').toLowerCase();
      const rec: JobRecord = {
        source_job_id: r.id,
        fingerprint,
        job_title: title,
        company,
        state,
        region: state ? stateToRegion(state) : null,
        workplace_type: normalizeWorkModel(v5.workplace_type),
        yearly_min_comp: v5.yearly_min_compensation ?? null,
        yearly_max_comp: v5.yearly_max_compensation ?? null,
        hourly_min_comp: v5.hourly_min_compensation ?? null,
        hourly_max_comp: v5.hourly_max_compensation ?? null,
        posted_date: posted,
        job_url: r.apply_url ?? null,
        is_contractish: isContractish,
        classification: cls,
        raw: {
          category: v5.job_category ?? null,
          seniority: v5.seniority_level ?? null,
          commitment,
          tools: (v5.technical_tools ?? []).slice(0, 8),
          licenses: (v5.licenses_or_certifications ?? []).slice(0, 5),
          state: stateRaw,
        },
      };
      if (!byFingerprint.has(fingerprint)) byFingerprint.set(fingerprint, rec);
    }
  }
  return [...byFingerprint.values()];
}

/** Posted comp midpoint in yearly terms; null when no usable range. */
export function postedMidpoint(job: JobRecord): { value: number; low: number | null; high: number | null } | null {
  let lo = job.yearly_min_comp;
  let hi = job.yearly_max_comp;
  if (lo === null && hi === null && (job.hourly_min_comp !== null || job.hourly_max_comp !== null)) {
    lo = job.hourly_min_comp !== null ? job.hourly_min_comp * 2080 : null;
    hi = job.hourly_max_comp !== null ? job.hourly_max_comp * 2080 : null;
  }
  if (lo === null && hi === null) return null;
  const value = lo !== null && hi !== null ? (lo + hi) / 2 : (lo ?? hi)!;
  if (value < 30000 || value > 900000) return null;
  return { value: Math.round(value), low: lo, high: hi };
}
