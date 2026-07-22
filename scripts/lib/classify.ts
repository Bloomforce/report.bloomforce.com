/**
 * Rules classifier for job postings and survey titles → role family,
 * seniority level, module. Encodes the Classification & Scrape Spec;
 * aliases mirror role_taxonomy.aliases in the Workforce Data project.
 */

export type RoleGroup = 'ic' | 'management';

export interface FamilyDef {
  code: string;
  label: string;
  group: RoleGroup;
  aliases: string[];
}

// Ordered by precedence: leadership before IC, specific before generic.
export const FAMILIES: FamilyDef[] = [
  { code: 'EXEC', label: 'CIO / CMIO / CNIO / CHIO', group: 'management', aliases: ['cio', 'cmio', 'cnio', 'chio', 'chief information officer', 'chief medical information officer', 'chief nursing information officer', 'chief technology officer', 'cto', 'chief digital officer', 'chief health information officer'] },
  { code: 'VP', label: 'VP / AVP of IT', group: 'management', aliases: ['vice president', 'avp', 'associate vice president', 'vp of it', 'vp applications', 'vp, information', 'vp information'] },
  { code: 'DIR', label: 'Director / Executive Director', group: 'management', aliases: ['director', 'executive director', 'senior director', 'associate director'] },
  { code: 'MGR', label: 'Applications / IT Manager', group: 'management', aliases: ['manager', 'supervisor', 'team lead', 'team leader'] },
  { code: 'PM', label: 'Project / Program Manager', group: 'ic', aliases: ['project manager', 'program manager', 'implementation manager', 'pmo lead', 'scrum master', 'delivery manager', 'project coordinator'] },
  { code: 'INT', label: 'Interface / Integration Analyst', group: 'ic', aliases: ['interface analyst', 'integration analyst', 'bridges', 'interface engineer', 'hl7', 'interface developer', 'integration engineer', 'integration architect', 'interoperability'] },
  { code: 'BI', label: 'Reporting / BI Developer (Cogito)', group: 'ic', aliases: ['cogito', 'clarity', 'caboodle', 'bi developer', 'bi analyst', 'business intelligence', 'reporting analyst', 'report writer', 'clarity developer', 'analytics analyst', 'data analyst', 'analytics engineer', 'data engineer', 'slicer dicer', 'slicerdicer'] },
  { code: 'SEC', label: 'Security / Identity Analyst', group: 'ic', aliases: ['security analyst', 'epic security', 'access analyst', 'provisioning analyst', 'identity analyst', 'iam analyst', 'application security', 'data security analyst'] },
  { code: 'TECH', label: 'Technical / Client Systems (ECSA)', group: 'ic', aliases: ['ecsa', 'client systems', 'technical services', 'systems engineer', 'system administrator', 'systems administrator', 'infrastructure engineer', 'hosting', 'citrix', 'hyperspace', 'cache administrator', 'iris administrator', 'database administrator', 'dba', 'storage engineer', 'network', 'solution architect', 'data architect', 'it architect', 'devops', 'cloud engineer'] },
  { code: 'PT', label: 'Principal Trainer', group: 'ic', aliases: ['principal trainer', 'instructional designer', 'training specialist', 'technical trainer', 'training manager', 'education specialist'] },
  { code: 'CT', label: 'Credentialed Trainer', group: 'ic', aliases: ['credentialed trainer', 'classroom trainer', 'trainer'] },
  { code: 'CI', label: 'Clinical Informatics Specialist', group: 'ic', aliases: ['clinical informatics', 'clinical informaticist', 'nursing informatics', 'informatics analyst', 'informatics specialist', 'physician informaticist', 'nurse informaticist', 'informaticist', 'clinical systems analyst'] },
  { code: 'AA', label: 'Application Analyst', group: 'ic', aliases: ['application analyst', 'applications analyst', 'application coordinator', 'applications coordinator', 'epic application', 'application analyst/coordinator', 'app analyst', 'application systems analyst', 'business systems analyst', 'ehr analyst', 'emr analyst', 'epic analyst', 'build analyst', 'systems analyst', 'clinical applications', 'business analyst', 'epic credentialed analyst', 'application specialist', 'epic consultant', 'solution analyst', 'application architect', 'willow analyst', 'beaker analyst', 'cadence analyst', 'resolute analyst', 'ambulatory analyst', 'clindoc analyst'] },
];

export const FAMILY_GROUP: Record<string, RoleGroup> = Object.fromEntries(FAMILIES.map((f) => [f.code, f.group]));
export const FAMILY_LABEL: Record<string, string> = Object.fromEntries(FAMILIES.map((f) => [f.code, f.label]));

export const MODULE_KEYWORDS: Record<string, string[]> = {
  willow: ['willow', 'pharmacy'], beaker: ['beaker', 'laboratory', ' lab '], cadence: ['cadence', 'scheduling'],
  prelude: ['prelude', 'registration'], grand_central: ['grand central', 'adt', 'bed management'],
  resolute_hb: ['resolute hospital', 'resolute hb', 'hospital billing'], resolute_pb: ['resolute professional', 'resolute pb', 'professional billing'],
  ambulatory: ['ambulatory', 'epiccare'], clindoc: ['clindoc', 'clinical documentation', 'inpatient clinical'],
  orders: ['orders', 'cpoe'], asap: ['asap', 'emergency'], optime: ['optime', 'surgical', 'perioperative'],
  anesthesia: ['anesthesia'], radiant: ['radiant', 'radiology'], cupid: ['cupid', 'cardiology'],
  stork: ['stork', 'obstetrics'], beacon: ['beacon', 'oncology'], mychart: ['mychart', 'patient portal'],
  healthy_planet: ['healthy planet', 'population health'], tapestry: ['tapestry', 'managed care'],
  him: ['him', 'health information management', 'identity', 'deficiency'], claims: ['claims', 'remittance'],
  cogito: ['cogito', 'clarity', 'caboodle', 'slicer'], bridges: ['bridges'], security: ['epic security', 'user security'],
  wisdom: ['wisdom', 'dental'], kaleidoscope: ['kaleidoscope', 'ophthalmology'], bones: ['bones', 'orthopedic'],
  dorothy: ['dorothy', 'home health'], compass_rose: ['compass rose', 'care management'],
};

export const MODULE_LABELS: Record<string, string> = {
  willow: 'Willow',
  beaker: 'Beaker',
  cadence: 'Cadence',
  prelude: 'Prelude',
  grand_central: 'Grand Central',
  resolute_hb: 'Hospital Billing',
  resolute_pb: 'Professional Billing',
  ambulatory: 'Ambulatory',
  clindoc: 'Clinical Documentation',
  orders: 'Orders',
  asap: 'ASAP',
  optime: 'OpTime',
  anesthesia: 'Anesthesia',
  radiant: 'Radiant',
  cupid: 'Cupid',
  stork: 'Stork',
  beacon: 'Beacon',
  mychart: 'MyChart',
  healthy_planet: 'Healthy Planet',
  tapestry: 'Tapestry',
  him: 'HIM',
  claims: 'Claims',
  cogito: 'Cogito',
  bridges: 'Bridges',
  security: 'Security',
  wisdom: 'Wisdom',
  kaleidoscope: 'Kaleidoscope',
  bones: 'Bones',
  dorothy: 'Dorothy',
  compass_rose: 'Compass Rose',
};

const EPIC_SIGNAL = /\bepic\b|hyperspace|epiccare|mychart|cogito|caboodle|willow|beaker|clindoc|optime|radiant|cupid|tapestry|resolute|slicer\s?dicer|grand central|healthy planet|bridges\b/i;

const HARD_EXCLUDE = /\b(rn|nurse|physician|therapist|pharmacist|technician|phlebotom|medical assistant|patient care|crna|paramedic|dietitian|surgeon|dentist|hygienist|social worker|case manager|chaplain|housekeep|custodian|food service|security officer|patient access rep|registrar|scheduler\b|front desk|call center|medical records clerk)\b/i;
const IT_CONTEXT = /\b(analyst|developer|engineer|administrator|architect|informati|application|system|integration|interface|report|data|bi\b|security|trainer|training|project|program|epic|ehr|emr|it\b|technical|technolog|digital|software|database|clinical documentation improvement)\b/i;

export interface Classification {
  isEpicIt: boolean;
  family: string | null;
  group: RoleGroup | null;
  level: string | null; // L1..L4, M1..M3, exec
  module: string | null;
  confidence: number;
}

function detectModule(text: string): string | null {
  const t = ` ${text.toLowerCase()} `;
  for (const [key, kws] of Object.entries(MODULE_KEYWORDS)) {
    if (kws.some((k) => t.includes(k))) return key;
  }
  return null;
}

function detectLevelFromTitle(title: string, group: RoleGroup, familyCode: string): string | null {
  const t = title.toLowerCase();
  if (group === 'management') {
    if (familyCode === 'EXEC') return 'exec';
    if (familyCode === 'VP') return 'M3';
    if (familyCode === 'DIR') return 'M2';
    return 'M1';
  }
  if (/\b(principal|lead|architect|expert|staff|iv|4)\b/.test(t)) return 'L4';
  if (/\b(senior|sr\.?|iii|3)\b/.test(t)) return 'L3';
  if (/\b(junior|jr\.?|entry|associate|i\b|1)\b/.test(t) && !/\bii\b/.test(t)) return 'L1';
  if (/\bii\b|2\b/.test(t)) return 'L2';
  return null;
}

export function classifyTitle(title: string, context = ''): Classification {
  const text = `${title} ${context}`;
  const t = title.toLowerCase();
  const none: Classification = { isEpicIt: false, family: null, group: null, level: null, module: null, confidence: 0 };
  if (!title) return none;
  if (HARD_EXCLUDE.test(t) && !EPIC_SIGNAL.test(text) && !/analyst|informati|application|system/i.test(t)) return none;

  let family: FamilyDef | null = null;
  for (const f of FAMILIES) {
    if (f.aliases.some((a) => t.includes(a))) { family = f; break; }
  }

  // Overrides per spec: Bridges → INT, Cogito/Clarity/Caboodle → BI
  if (family && family.code === 'AA') {
    if (/bridges/i.test(t)) family = FAMILIES.find((f) => f.code === 'INT')!;
    if (/cogito|clarity|caboodle/i.test(t)) family = FAMILIES.find((f) => f.code === 'BI')!;
  }

  // Generic leadership titles need IT context to count as Epic-IT leadership
  const epicish = EPIC_SIGNAL.test(text);
  if (!family) {
    if (epicish && IT_CONTEXT.test(t)) {
      family = FAMILIES.find((f) => f.code === 'AA')!;
    } else {
      return none;
    }
  }
  // Leadership titles are generic ("Manager", "Director") — require an IT/EHR
  // signal in the TITLE itself, or the scrape sweeps in practice/clinic managers
  // at Epic-using orgs and drags leadership comp toward non-IT roles.
  const IT_TITLE = /\b(it|is|epic|ehr|emr|application|informatic|analytic|technical|technolog|system|integration|interface|data|digital|information|security|infrastructure|pmo|clinical apps?|revenue cycle)\b/i;
  if (family.group === 'management' && !IT_TITLE.test(t)) return none;
  if (!epicish && !IT_CONTEXT.test(t)) return none;

  const level = detectLevelFromTitle(title, family.group, family.code);
  const module = detectModule(text);
  const confidence = epicish ? 0.9 : 0.7;
  return { isEpicIt: epicish || IT_CONTEXT.test(t), family: family.code, group: family.group, level, module, confidence };
}

/** Map the hiring.cafe v5 seniority label to a level when the title has none. */
export function levelFromV5Seniority(v5: string | null | undefined): string | null {
  if (!v5) return null;
  const v = v5.toLowerCase();
  if (v.includes('senior')) return 'L3';
  if (v.includes('mid')) return 'L2';
  if (v.includes('entry') || v.includes('no prior')) return 'L1';
  return null;
}

export function roleKey(family: string, level: string | null): string {
  return level ? `${family}.${level}` : family;
}
