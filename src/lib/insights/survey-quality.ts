export const MANAGEMENT_FAMILIES = new Set(['MGR', 'DIR', 'VP', 'EXEC']);

export interface QualityResult {
  disposition: 'accept' | 'review' | 'reject';
  reasons: string[];
}

export function compensationBounds(roleFamily: string): [number, number] {
  return MANAGEMENT_FAMILIES.has(roleFamily) ? [60_000, 700_000] : [40_000, 300_000];
}

export function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return Number.NaN;
  if (sorted.length === 1) return sorted[0];
  const index = (p / 100) * (sorted.length - 1);
  const low = Math.floor(index);
  const high = Math.ceil(index);
  if (low === high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (index - low);
}

/** Conservative 3x-IQR bounds: intended to catch major errors, not trim tails. */
export function majorOutlierBounds(values: number[]): { low: number; high: number } | null {
  if (values.length < 8) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = percentile(sorted, 25);
  const q3 = percentile(sorted, 75);
  const iqr = q3 - q1;
  if (!Number.isFinite(iqr) || iqr <= 0) return null;
  return { low: q1 - 3 * iqr, high: q3 + 3 * iqr };
}

export function evaluateSalary(
  roleFamily: string,
  baseComp: number,
  acceptedFamilyValues: number[],
): QualityResult {
  const reasons: string[] = [];
  const [hardLow, hardHigh] = compensationBounds(roleFamily);
  if (!Number.isFinite(baseComp) || baseComp < hardLow || baseComp > hardHigh) {
    return {
      disposition: 'reject',
      reasons: [`base_salary_outside_hard_bounds:${hardLow}-${hardHigh}`],
    };
  }

  const robust = majorOutlierBounds(acceptedFamilyValues);
  if (robust && (baseComp < robust.low || baseComp > robust.high)) {
    reasons.push(`major_outlier_review:${Math.round(robust.low)}-${Math.round(robust.high)}`);
  }

  return { disposition: reasons.length ? 'review' : 'accept', reasons };
}

export function normalizedRespondentKey(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const bytes = new TextEncoder().encode(normalized);
  return crypto.subtle.digest('SHA-256', bytes).then((hash) =>
    Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join(''),
  );
}
