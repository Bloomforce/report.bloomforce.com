export const STATE_TO_CODE: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO',
  connecticut: 'CT', delaware: 'DE', 'district of columbia': 'DC', florida: 'FL', georgia: 'GA',
  hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY',
  louisiana: 'LA', maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN',
  mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH', oklahoma: 'OK', oregon: 'OR',
  pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD',
  tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA',
  'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY',
};

const CODE_TO_REGION: Record<string, string> = {};
for (const [region, codes] of Object.entries({
  Midwest: ['IA', 'IL', 'IN', 'KS', 'MI', 'MN', 'MO', 'ND', 'NE', 'OH', 'SD', 'WI'],
  Northeast: ['CT', 'DC', 'DE', 'MA', 'MD', 'ME', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'],
  Southeast: ['AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV'],
  Southwest: ['AZ', 'NM', 'OK', 'TX'],
  West: ['AK', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'OR', 'UT', 'WA', 'WY'],
})) {
  for (const c of codes) CODE_TO_REGION[c] = region;
}

export function stateToCode(input: string | null | undefined): string | null {
  if (!input) return null;
  const cleaned = input.replace(/,\s*US.*$/i, '').trim();
  if (/^[A-Z]{2}$/.test(cleaned)) return cleaned in CODE_TO_REGION ? cleaned : null;
  return STATE_TO_CODE[cleaned.toLowerCase()] ?? null;
}

export function stateToRegion(input: string | null | undefined): string | null {
  const code = stateToCode(input);
  return code ? CODE_TO_REGION[code] ?? null : null;
}

export function parseMoney(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;
  const m = input.replace(/[$,\s]/g, '').match(/\d+(\.\d+)?/);
  if (!m) return null;
  return parseFloat(m[0]);
}

/** Survey base-salary parser: values under $1k are treated as hourly. */
export function parseAnnualComp(input: string | number | null | undefined): number | null {
  let v = parseMoney(input);
  if (v === null || v <= 0) return null;
  if (v < 1000) v = v * 2080;
  else if (v < 20000) return null; // ambiguous (monthly? typo) — drop
  return Math.round(v);
}

export function plausibleComp(value: number, roleGroup: 'ic' | 'management'): boolean {
  return roleGroup === 'management' ? value >= 60000 && value <= 800000 : value >= 30000 && value <= 400000;
}

export function normalizeWorkModel(input: string | null | undefined): string | null {
  if (!input) return null;
  const v = input.toLowerCase();
  if (v.includes('remote')) return 'remote';
  if (v.includes('hybrid')) return 'hybrid';
  if (v.includes('office') || v.includes('site')) return 'onsite';
  return null;
}

export function normalizeEmployerType(input: string | null | undefined): string {
  if (!input) return 'other';
  const v = input.toLowerCase();
  if (v.includes('multi-state') || v.includes('multi state')) return 'multi_state_system';
  if (v.includes('single-state') || v.includes('single state')) return 'single_state_system';
  if (v.includes('academic')) return 'academic';
  if (v.includes('children')) return 'childrens';
  if (v.includes('independent') || v.includes('physician group')) return 'independent';
  if (v.includes('it firm') || v.includes('consult') || v.includes('managed') || v.includes('outsourc') || v.includes('msp')) return 'consulting_msp';
  if (v.includes('payer') || v.includes('managed care')) return 'payer';
  if (v.includes('government') || v.includes('public') || v.includes('fqhc') || v.includes('federally qualified')) return 'government';
  if (v.includes('saas') || v.includes('vendor') || v.includes('develo') || v.includes('tech')) return 'vendor_healthtech';
  if (v.includes('retail') || v.includes('community') || v.includes('clinic')) return 'community';
  return 'other';
}

export const EMPLOYER_TYPE_LABELS: Record<string, string> = {
  multi_state_system: 'Multi-state health system',
  single_state_system: 'Single-state health system',
  academic: 'Academic medical center',
  childrens: "Children's hospital",
  independent: 'Independent hospital / physician group',
  consulting_msp: 'Consulting / managed services',
  payer: 'Payer',
  government: 'Government / public',
  vendor_healthtech: 'Vendor / health tech',
  community: 'Community / retail health',
  other: 'Other',
};

export function yearsBandMidpoint(input: string | null | undefined): number | null {
  if (!input) return null;
  const v = input.toLowerCase();
  if (v.includes('less than 1')) return 0.5;
  const m = v.match(/(\d+)\s*-\s*(\d+)/);
  if (m) return (parseInt(m[1]) + parseInt(m[2])) / 2;
  const plus = v.match(/(\d+)\s*\+/);
  if (plus) return parseInt(plus[1]) + 2;
  const single = v.match(/\d+/);
  return single ? parseInt(single[0]) : null;
}

/** Linear-interpolation percentile over raw values. */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  if (sorted.length === 1) return sorted[0];
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  return percentile(s, 50);
}

/** 1.5×IQR trim; returns the surviving values. */
export function iqrTrim(values: number[]): number[] {
  if (values.length < 8) return values;
  const s = [...values].sort((a, b) => a - b);
  const q1 = percentile(s, 25);
  const q3 = percentile(s, 75);
  const iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  return values.filter((v) => v >= lo && v <= hi);
}
