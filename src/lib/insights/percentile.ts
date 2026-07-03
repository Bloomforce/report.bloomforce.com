import type { Percentiles } from './types';

/**
 * Piecewise-linear percentile estimate over the five published breakpoints.
 * Clamped to [2, 98] — outside p10/p90 the UI must say "below the 10th" /
 * "above the 90th" rather than quote a falsely precise number.
 */
export function estimatePercentile(comp: number, p: Percentiles): number {
  const pts: [number, number][] = [
    [10, p.p10],
    [25, p.p25],
    [50, p.p50],
    [75, p.p75],
    [90, p.p90],
  ];
  if (comp <= p.p10) {
    const span = p.p25 - p.p10 || 1;
    return Math.max(2, 10 - 8 * ((p.p10 - comp) / span));
  }
  if (comp >= p.p90) {
    const span = p.p90 - p.p75 || 1;
    return Math.min(98, 90 + 8 * ((comp - p.p90) / span));
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const [pLo, vLo] = pts[i];
    const [pHi, vHi] = pts[i + 1];
    if (comp >= vLo && comp <= vHi) {
      return vHi === vLo ? pLo : pLo + ((comp - vLo) / (vHi - vLo)) * (pHi - pLo);
    }
  }
  return 50;
}

export function percentileLabel(pct: number): string {
  if (pct <= 10) return 'below the 10th percentile';
  if (pct >= 90) return 'above the 90th percentile';
  return `≈ ${ordinal(Math.round(pct))} percentile`;
}

export function ordinal(n: number): string {
  const rem10 = n % 10;
  const rem100 = n % 100;
  if (rem10 === 1 && rem100 !== 11) return `${n}st`;
  if (rem10 === 2 && rem100 !== 12) return `${n}nd`;
  if (rem10 === 3 && rem100 !== 13) return `${n}rd`;
  return `${n}th`;
}
