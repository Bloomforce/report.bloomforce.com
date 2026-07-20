export interface SurveyInstrument {
  key: string;
  providerFormId: string;
  audience: string;
  version: number;
}

export const JOTFORM_INSTRUMENTS: Record<string, SurveyInstrument> = {
  '261236096913156': {
    key: '2026_health_system_fte',
    providerFormId: '261236096913156',
    audience: 'health_system_fte',
    version: 1,
  },
  '261235120925146': {
    key: '2026_health_system_leader',
    providerFormId: '261235120925146',
    audience: 'health_system_leader',
    version: 1,
  },
  '261212814610142': {
    key: '2026_consultant_contractor',
    providerFormId: '261212814610142',
    audience: 'consultant_contractor',
    version: 1,
  },
  '261235387748164': {
    key: '2026_application_managed_services',
    providerFormId: '261235387748164',
    audience: 'application_managed_services',
    version: 1,
  },
  '261235392416152': {
    key: '2026_other_healthcare_it',
    providerFormId: '261235392416152',
    audience: 'other_healthcare_it',
    version: 1,
  },
};

function stringValue(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  return null;
}

export function parseJotformPayload(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw !== 'string') throw new Error('Jotform rawRequest is missing');
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Jotform rawRequest is not an object');
  }
  return parsed as Record<string, unknown>;
}

export function jotformEnvelope(payload: Record<string, unknown>) {
  const formId =
    stringValue(payload.formID) ??
    stringValue(payload.formId) ??
    stringValue(payload.form_id);
  const submissionId =
    stringValue(payload.submissionID) ??
    stringValue(payload.submissionId) ??
    stringValue(payload.submission_id);
  if (!formId || !submissionId) throw new Error('Jotform form or submission ID is missing');

  const instrument = JOTFORM_INSTRUMENTS[formId];
  if (!instrument) throw new Error(`Unregistered Jotform form: ${formId}`);

  const submittedAt =
    stringValue(payload.created_at) ??
    stringValue(payload.submitDate) ??
    stringValue(payload.submitted_at);
  return { formId, submissionId, instrument, submittedAt };
}
