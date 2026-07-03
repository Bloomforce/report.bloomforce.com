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

export const CREDENTIAL_LABELS: Record<string, string> = {
  pharmd_rph: 'PharmD / RPh',
  rn_bsn: 'RN / BSN',
  rhia_rhit: 'RHIA / RHIT',
  md_do: 'MD / DO',
  other_clinical: 'Other clinical',
};

export const WORK_MODEL_LABELS: Record<string, string> = {
  remote: 'Fully remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
};
