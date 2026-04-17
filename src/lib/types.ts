// ─── Salary Data ───────────────────────────────────────────

export interface SalaryDistribution {
  low: number;
  p25: number;
  median: number;
  average: number;
  p75: number;
  high: number;
}

export interface SalaryBreakdownEntry {
  label: string;
  distribution: SalaryDistribution;
}

export interface SalaryBreakdownCategory {
  categoryName: string;
  categoryKey: string;
  entries: SalaryBreakdownEntry[];
  gated: boolean;
}

export interface RoleSalaryData {
  roleId: string;
  roleName: string;
  overall: SalaryDistribution;
  breakdowns: SalaryBreakdownCategory[];
}

export interface SalaryData {
  reportYear: number;
  roles: RoleSalaryData[];
}

// ─── Sentiment Data ────────────────────────────────────────

export interface SentimentDataPoint {
  label: string;
  value: number;
  comparison?: number;
}

export interface SentimentCategory {
  categoryId: string;
  categoryName: string;
  headline: string;
  headlineStat: number;
  unit: string;
  dataPoints: SentimentDataPoint[];
  gated: boolean;
}

// ─── Industry Trends ───────────────────────────────────────

export interface TrendCard {
  trendId: string;
  title: string;
  headline: string;
  headlineStat: number;
  unit: string;
  description: string;
  details: string[];
}

// ─── Methodology ───────────────────────────────────────────

export interface MethodologyData {
  totalResponses: number;
  epicPercentage: number;
  healthSystemPercentage: number;
  genderSplit: { male: number; female: number };
  experienceDistribution: SentimentDataPoint[];
  educationDistribution?: SentimentDataPoint[];
  surveyPeriod: string;
}

// ─── Lead Capture ──────────────────────────────────────────

export interface LeadFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  role: string;
  phone: string;
}

// ─── Highlights for Hero ───────────────────────────────────

export interface HighlightStat {
  id: string;
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
  icon?: string;
}
