import salaryData from '@/data/salaries.json';
import sentimentData from '@/data/sentiment.json';
import trendsData from '@/data/trends.json';
import highlightsData from '@/data/highlights.json';
import methodologyData from '@/data/methodology.json';
import type { SalaryData, RoleSalaryData, SentimentCategory, TrendCard, MethodologyData, HighlightStat } from './types';

export function getSalaryData(): SalaryData {
  return salaryData as SalaryData;
}

export function getAllRoles(): RoleSalaryData[] {
  return salaryData.roles as RoleSalaryData[];
}

export function getRoleById(id: string): RoleSalaryData | undefined {
  return (salaryData.roles as RoleSalaryData[]).find((r) => r.roleId === id);
}

export function getSentimentCategories(): SentimentCategory[] {
  return sentimentData.categories as SentimentCategory[];
}

export function getFreeSentiment(): SentimentCategory[] {
  return sentimentData.categories.filter((c) => !c.gated) as SentimentCategory[];
}

export function getGatedSentiment(): SentimentCategory[] {
  return sentimentData.categories.filter((c) => c.gated) as SentimentCategory[];
}

export function getTrends(): TrendCard[] {
  return trendsData.trends as TrendCard[];
}

export function getHighlights(): { heroStats: HighlightStat[]; keyFindings: HighlightStat[] } {
  return highlightsData as { heroStats: HighlightStat[]; keyFindings: HighlightStat[] };
}

export function getMethodology(): MethodologyData {
  return methodologyData as MethodologyData;
}
