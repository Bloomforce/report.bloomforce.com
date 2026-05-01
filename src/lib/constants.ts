export const SECTION_IDS = {
  hero: 'hero',
  keyFindings: 'key-findings',
  salaryExplorer: 'salary-explorer',
  sentiment: 'workforce-insights',
  trends: 'industry-trends',
  methodology: 'methodology',
  cta: 'book-a-call',
} as const;

export const NAV_ITEMS = [
  { label: 'Key Findings', href: `#${SECTION_IDS.keyFindings}` },
  { label: 'Salary Explorer', href: `#${SECTION_IDS.salaryExplorer}` },
  { label: 'Workforce Insights', href: `#${SECTION_IDS.sentiment}` },
  { label: 'Industry Trends', href: `#${SECTION_IDS.trends}` },
  { label: 'Methodology', href: `#${SECTION_IDS.methodology}` },
] as const;

export const BOOK_CALL_URL = 'https://www.bloomforce.com/book';

export const LEAD_STORAGE_KEY = 'bf_lead';
