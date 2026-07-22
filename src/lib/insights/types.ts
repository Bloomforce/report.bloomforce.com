export type Seniority = 'L1' | 'L2' | 'L3' | 'L4' | 'M1' | 'M2' | 'M3' | 'exec';
export type WorkModel = 'remote' | 'hybrid' | 'onsite';

export interface Percentiles {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface BenchmarkRow {
  roleKey: string;
  roleFamily: string;
  roleName: string;
  module: string;
  seniority: Seniority | 'ALL';
  region: string;
  workModel: WorkModel | 'all';
  employerType: string;
  n: number;
  blended: Percentiles;
  remoteShare: number | null;
  confidenceTier: 'direct' | 'blended' | 'modeled';
  medianDelta90d: number | null;
  spark: number[] | null;
  updatedAt: string;
}

export interface MarketDetailRow {
  roleKey: string;
  region: string;
  demandCount: number;
  demandDelta30d: number | null;
  demandTrend: number[];
  hotspots: { label: string; kind: 'region' | 'employerType'; share: number; openings: number }[];
  cuts: {
    dimension: 'workModel' | 'employerType' | 'credential';
    label: string;
    n: number;
    blended: Percentiles;
  }[];
  postedTrend: { month: string; median: number; n: number }[];
  updatedAt: string;
}

export interface SentimentCut {
  id: string;
  metricKey: string;
  question: string;
  surveyYear: number;
  cohort: { roleFamily?: string; workModel?: string; region?: string; seniority?: Seniority | 'ALL' };
  n: number;
  values: { key: string; label: string; value: number; deltaYoY?: number | null }[];
  updatedAt: string;
}

export interface PulseItem {
  id: string;
  ts: string;
  kind: 'benchmark_move' | 'demand_shift' | 'new_data' | 'industry_news';
  text: string;
  roleKey?: string;
  deltaValue?: number;
  deltaUnit?: '$' | 'pts' | '%';
}

export interface DemandCell {
  key: string;
  label: string;
  dimension: 'role_family' | 'module';
  share: number;
  delta30d: number | null;
}

export interface WorkModelCut {
  workModel: WorkModel;
  share: number;
  median: number | null;
  n: number;
}

export interface FreshnessMeta {
  benchmarkCells: number;
  totalRespondents: number;
  postingsIngested: number;
  lastSurveyIngest: string;
  lastPulseRefresh: string;
  asOf: string;
  windowLabel: string;
}

export interface RoleOption {
  roleKey: string;
  label: string;
  group: string;
}

export interface InsightsData {
  benchmarks: BenchmarkRow[];
  sentiment: SentimentCut[];
  pulse: PulseItem[];
  demand: DemandCell[];
  moduleDemand: DemandCell[];
  workModels: WorkModelCut[];
  freshness: FreshnessMeta;
  roles: RoleOption[];
  regions: string[];
}

export interface BenchmarkProfile {
  roleKey: string;
  seniority: Seniority | 'ALL';
  region: string;
  comp?: number;
}

export interface ContributionFormData {
  roleFamily: string;
  seniority: Seniority;
  employerType: string;
  region: string;
  baseComp: number;
  bonusComp?: number;
  workModel?: WorkModel;
  module?: string;
  credential?: string;
  email: string;
}
