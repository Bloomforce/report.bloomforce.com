import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import { normalizeEmployerType } from '../lib/normalize';
import { roleKey } from '../lib/classify';

export interface UmObservation {
  role_family: string;
  seniority_level: string;
  role_key: string;
  base_comp: number;
  employer_type: string;
  region: string;
  period: string;
  external_ref: string;
}

/** UM levels use an older vocabulary; normalize to L1-L4 / M1-M3 / exec. */
function normalizeLevel(family: string, level: string): { family: string; level: string } {
  switch (level) {
    case 'manager':
    case 'sr_manager':
      return { family: 'MGR', level: 'M1' };
    case 'director':
      return { family: 'DIR', level: 'M2' };
    case 'exec_director':
      // "executive director" is DIR-family per the role taxonomy, not C-suite
      return { family: 'DIR', level: 'M2' };
    default:
      return { family, level };
  }
}

export function loadUm(path: string): UmObservation[] {
  const rows: string[][] = parse(fs.readFileSync(path, 'utf8'), { relax_column_count: true });
  const out: UmObservation[] = [];
  rows.slice(1).forEach((r, i) => {
    const base = parseFloat(r[3]);
    if (!Number.isFinite(base) || base < 30000 || base > 900000) return;
    const { family, level } = normalizeLevel(r[1], r[2]);
    out.push({
      role_family: family,
      seniority_level: level,
      role_key: roleKey(family, level),
      base_comp: Math.round(base),
      employer_type: normalizeEmployerType(r[5]),
      region: r[6] || 'Midwest',
      period: r[7] || '2025-11-01',
      external_ref: `um:${i}`,
    });
  });
  return out;
}
