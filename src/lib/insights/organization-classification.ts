export const EMPLOYER_TYPES = [
  'academic_medical_center',
  'childrens_hospital',
  'independent_hospital',
  'single_state_system',
  'multi_state_system',
  'payer',
  'government',
  'consulting',
  'vendor',
  'other',
] as const;

export type EmployerType = (typeof EMPLOYER_TYPES)[number];

export interface OrganizationReference {
  accountId: string;
  canonicalName: string;
  employerType: EmployerType;
  aliases: string[];
}

export interface OrganizationClassification {
  rawName: string;
  normalizedName: string;
  canonicalName: string | null;
  accountId: string | null;
  employerType: EmployerType | null;
  method: 'bloomos_alias' | 'rule' | 'review';
  confidence: number;
  signals: string[];
}

export function normalizeOrganizationName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\b(the|incorporated|inc|llc|corp|corporation|company|co)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function classifyOrganization(
  rawName: string,
  organizations: OrganizationReference[] = [],
): OrganizationClassification {
  const normalizedName = normalizeOrganizationName(rawName);

  for (const organization of organizations) {
    const names = [organization.canonicalName, ...organization.aliases].map(normalizeOrganizationName);
    if (names.includes(normalizedName)) {
      return {
        rawName,
        normalizedName,
        canonicalName: organization.canonicalName,
        accountId: organization.accountId,
        employerType: organization.employerType,
        method: 'bloomos_alias',
        confidence: 1,
        signals: ['Matched a verified BloomOS account name or alias'],
      };
    }
  }

  const rules: Array<{ pattern: RegExp; employerType: EmployerType; confidence: number; signal: string }> = [
    { pattern: /\bchildren(?:s|\s+s)?\b|\bpediatric\b/, employerType: 'childrens_hospital', confidence: 0.9, signal: "Name indicates a children's hospital" },
    { pattern: /\buniversity|academic|medical branch\b/, employerType: 'academic_medical_center', confidence: 0.82, signal: 'Name indicates an academic health organization' },
    { pattern: /\bdepartment of|county|state of|federal|veterans affairs|public health\b/, employerType: 'government', confidence: 0.88, signal: 'Name indicates a public-sector organization' },
    { pattern: /\bhealth plan|healthplan|insurance|payer\b/, employerType: 'payer', confidence: 0.8, signal: 'Name indicates a health plan or payer' },
    { pattern: /\bconsulting|staffing|solutions|services group\b/, employerType: 'consulting', confidence: 0.68, signal: 'Name suggests a consulting or services firm' },
    { pattern: /\bsoftware|technologies|technology|systems vendor\b/, employerType: 'vendor', confidence: 0.66, signal: 'Name suggests a technology vendor' },
  ];
  const rule = rules.find((item) => item.pattern.test(normalizedName));
  if (rule) {
    return {
      rawName,
      normalizedName,
      canonicalName: null,
      accountId: null,
      employerType: rule.employerType,
      method: 'rule',
      confidence: rule.confidence,
      signals: [rule.signal],
    };
  }

  return {
    rawName,
    normalizedName,
    canonicalName: null,
    accountId: null,
    employerType: null,
    method: 'review',
    confidence: 0,
    signals: ['No verified account alias or reliable organization-type rule'],
  };
}
