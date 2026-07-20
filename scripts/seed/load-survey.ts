import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import {
  normalizeEmployerType,
  normalizeWorkModel,
  parseAnnualComp,
  parseMoney,
  plausibleComp,
  stateToCode,
  stateToRegion,
  yearsBandMidpoint,
} from '../lib/normalize';
import { FAMILY_GROUP, roleKey } from '../lib/classify';

export interface SurveyRecord {
  external_id: string;
  submitted_at: string;
  survey_year: number;
  role_family: string | null;
  module: string | null;
  seniority_level: string | null;
  role_key: string | null;
  region: string | null;
  state: string | null;
  years_experience: number | null;
  employer_type: string;
  work_model: string | null;
  base_comp: number | null;
  bonus_comp: number | null;
  credential: string | null;
  raw: Record<string, string>;
}

const TITLE_FAMILY_2024: Record<string, [string, string | null]> = {
  'Application / System Analyst': ['AA', null],
  'IT Leadership': ['MGR', 'M1'],
  'Project Manager': ['PM', null],
  'Team Lead': ['MGR', 'M1'],
  'Principal Trainer': ['PT', null],
  'Clinical Informatics Specialist': ['CI', null],
  'Credentialed Trainer': ['CT', null],
  'System Administrator': ['TECH', null],
  'BI Developer / Report Writer': ['BI', null],
  'Database Administrator': ['TECH', null],
  'Instructional Designer': ['PT', null],
  'Epic Support Analyst': ['AA', null],
  'EHR support Specialist': ['AA', null],
};

const TITLE_FAMILY_2025: Record<string, [string, string | null]> = {
  'Application Coordinator / Application Analyst': ['AA', null],
  'Clinical Informatics Analyst/Specialist': ['CI', null],
  'Principal Trainer': ['PT', null],
  'BI Developer / Report Writer': ['BI', null],
  'Credentialed Trainer': ['CT', null],
  'Application / Solution Architect / Engineer': ['TECH', 'L4'],
  'Project Manager': ['PM', null],
  'Business Analyst': ['AA', null],
  'Data Analyst': ['BI', null],
  'Team Lead / Supervisor': ['MGR', 'M1'],
  'System Administrator': ['TECH', null],
  'Integration Architect': ['INT', 'L4'],
  'IT Architect': ['TECH', 'L4'],
};

function leadershipFromSeniority(s: string | undefined): [string, string] | null {
  if (!s) return null;
  const v = s.toLowerCase();
  if (/(chief|cio|cmio|cnio|ceo|cto)/.test(v)) return ['EXEC', 'exec'];
  if (/vice president|vp\b|avp/.test(v)) return ['VP', 'M3'];
  if (/director/.test(v)) return ['DIR', 'M2'];
  if (/senior manager|manager|supervisor|team lead/.test(v)) return ['MGR', 'M1'];
  return null;
}

function icLevelFromYears(years: number | null): string | null {
  if (years === null) return null;
  if (years <= 3) return 'L1';
  if (years <= 8) return 'L2';
  return 'L3';
}

function icLevelFrom2024Level(level: string | undefined): string | null {
  if (!level) return null;
  const v = level.toLowerCase();
  if (v.includes('entry')) return 'L1';
  if (v.includes('mid')) return 'L2';
  if (v.includes('senior')) return 'L3';
  return null;
}

function isTestRow(cells: string[]): boolean {
  return cells.some((c) => /jennifer pollard|^test\b|\btest -/i.test(c || ''));
}

function credentialFrom(text: string | undefined): string | null {
  if (!text) return null;
  const v = text.toLowerCase();
  if (v.includes('pharm')) return 'pharmd_rph';
  if (/\brn\b|\bbsn\b|nursing/.test(v)) return 'rn_bsn';
  if (/rhia|rhit/.test(v)) return 'rhia_rhit';
  if (/\bmd\b|\bdo\b|physician/.test(v)) return 'md_do';
  if (v.includes('none') || v === '') return null;
  return 'other_clinical';
}

export function loadSurveys(paths: { y2024: string; y2025: string }): SurveyRecord[] {
  const out: SurveyRecord[] = [];

  const rows2024: string[][] = parse(fs.readFileSync(paths.y2024, 'utf8'), { relax_column_count: true });
  for (const r of rows2024.slice(1)) {
    if (isTestRow(r)) continue;
    const title = (r[3] || '').trim();
    const lead = leadershipFromSeniority(r[6]);
    const mapped = TITLE_FAMILY_2024[title] ?? null;
    const family = lead ? lead[0] : mapped ? mapped[0] : null;
    const level = lead ? lead[1] : mapped ? mapped[1] ?? icLevelFrom2024Level(r[4]) : null;
    const years = yearsBandMidpoint(r[5]);
    const state = stateToCode(r[14]) ?? stateToCode(r[15]);
    const base = parseAnnualComp(r[23]);
    out.push({
      external_id: `2024:${r[1]}`,
      submitted_at: new Date(r[2]).toISOString(),
      survey_year: 2024,
      role_family: family,
      module: null,
      seniority_level: level,
      role_key: family ? roleKey(family, level) : null,
      region: state ? stateToRegion(state) : null,
      state,
      years_experience: years,
      employer_type: normalizeEmployerType(r[11]),
      work_model: normalizeWorkModel(r[13]),
      base_comp: base,
      bonus_comp: parseMoney(r[24]),
      credential: credentialFrom(r[9]),
      raw: {
        title,
        level: r[4] || '',
        seniority: r[6] || '',
        education: r[8] || '',
        gender: r[10] || '',
        ehr: r[12] || '',
        hires_remote: r[16] || '',
        rto_response: r[17] || '',
        connection: r[18] || '',
        mobility_team: r[19] || '',
        mobility_role: r[20] || '',
        ma: r[21] || '',
        rif: r[22] || '',
        sat_comp: r[25] || '',
        sat_wlb: r[26] || '',
        sat_culture: r[27] || '',
        sat_growth: r[28] || '',
        job_seeking: r[29] || '',
        turnover: r[32] || '',
      },
    });
  }

  const rows2025: string[][] = parse(fs.readFileSync(paths.y2025, 'utf8'), { relax_column_count: true });
  for (const r of rows2025.slice(1)) {
    if (isTestRow(r)) continue;
    const title = (r[9] || '').trim();
    const lead = leadershipFromSeniority(r[16]);
    const mapped = TITLE_FAMILY_2025[title] ?? (title ? TITLE_FAMILY_2025[Object.keys(TITLE_FAMILY_2025).find((k) => title.startsWith(k.slice(0, 12))) ?? ''] ?? null : null);
    const years = yearsBandMidpoint(r[15]);
    const family = lead ? lead[0] : mapped ? mapped[0] : title ? 'AA' : null;
    const level = lead ? lead[1] : mapped && mapped[1] ? mapped[1] : icLevelFromYears(years);
    const state = stateToCode(r[23]) ?? stateToCode(r[22]);
    const base = parseAnnualComp(r[48]);
    out.push({
      external_id: `2025:${r[1]}`,
      submitted_at: new Date(r[2]).toISOString(),
      survey_year: 2025,
      role_family: family,
      module: null,
      seniority_level: level,
      role_key: family ? roleKey(family, level) : null,
      region: state ? stateToRegion(state) : null,
      state,
      years_experience: years,
      employer_type: normalizeEmployerType(r[20]),
      work_model: normalizeWorkModel(r[21]),
      base_comp: base,
      bonus_comp: parseMoney(r[50]),
      credential: null,
      raw: {
        title,
        seniority: r[16] || '',
        education: r[18] || '',
        gender: r[19] || '',
        ehr: r[5] || '',
        has_reports: r[6] || '',
        new_job_2024: r[7] || '',
        left_reason: r[8] || '',
        functional_area: r[13] || '',
        hires_remote: r[24] || '',
        remote_policy: r[25] || '',
        rto_response: r[26] || '',
        mgr_remote_view: r[27] || '',
        sat_wlb: r[28] || '',
        recognized: r[29] || '',
        progression_factor: r[30] || '',
        mobility_team: r[31] || '',
        mobility_role: r[32] || '',
        ehr_mgmt: r[33] || '',
        msp: r[34] || '',
        ma: r[37] || '',
        ma_stronger: r[38] || '',
        rif: r[41] || '',
        hosting_migration: r[42] || '',
        ai_org: r[43] || '',
        ai_structure: r[44] || '',
        ai_impact: r[45] || '',
        ambient: r[46] || '',
        ai_governance: r[47] || '',
        bonus_types: r[49] || '',
        fair_comp: r[51] || '',
        job_seeking: r[52] || '',
        turnover: r[54] || '',
        attract_challenges: r[56] || '',
        retain_challenges: r[57] || '',
        retain_strategies: r[58] || '',
        hot_skills_comp: r[59] || '',
      },
    });
  }

  // Comp plausibility: null out weird values but keep the row (sentiment still counts)
  for (const rec of out) {
    if (rec.base_comp !== null && rec.role_family) {
      const group = FAMILY_GROUP[rec.role_family] ?? 'ic';
      if (!plausibleComp(rec.base_comp, group)) rec.base_comp = null;
    }
    if (rec.bonus_comp !== null && (rec.bonus_comp! < 0 || rec.bonus_comp! > 200000)) rec.bonus_comp = null;
  }
  return out;
}
