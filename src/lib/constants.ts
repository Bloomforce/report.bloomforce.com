export const SECTION_IDS = {
  hero: 'hero',
  terminal: 'market',
  orgType: 'org-type',
  marketDetail: 'market-detail',
  sentimentStory: 'workforce-insights',
  trends: 'industry-trends',
  ladder: 'career-ladder',
  methodology: 'methodology',
  cta: 'book-a-call',
  // legacy ids used by the archived /2025 report
  keyFindings: 'key-findings',
  salaryExplorer: 'salary-explorer',
  sentiment: 'workforce-insights',
} as const;

export const NAV_ITEMS = [
  { label: 'Your Benchmark', href: `#${SECTION_IDS.hero}` },
  { label: 'Market', href: `#${SECTION_IDS.terminal}` },
  { label: 'Workforce Insights', href: `#${SECTION_IDS.sentimentStory}` },
  { label: 'Career Ladder', href: `#${SECTION_IDS.ladder}` },
  { label: 'Methodology', href: `#${SECTION_IDS.methodology}` },
] as const;

export const BOOK_CALL_URL = 'https://www.bloomforce.com/book';
export const SURVEY_URL = 'https://www.bloomforce.com/survey';

export const LEAD_STORAGE_KEY = 'bf_lead';
export const CONTRIBUTION_STORAGE_KEY = 'bf_contribution';
export const PROFILE_STORAGE_KEY = 'bf_profile';
