'use client';

import type { SalaryDistribution } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface SalaryRangeChartProps {
  distribution: SalaryDistribution;
  label?: string;
  compact?: boolean;
}

export function SalaryRangeChart({ distribution, label, compact = false }: SalaryRangeChartProps) {
  const { low, p25, median, average, p75, high } = distribution;

  /*
   * Use a padded range so markers near the edges don't get clipped.
   * Add 8% padding on each side of the actual data range so that
   * the "low" label isn't at 0% and "high" isn't at 100%.
   */
  const dataRange = high - low;
  const pad = dataRange * 0.08;
  const chartLow = low - pad;
  const chartRange = dataRange + pad * 2;
  const toPercent = (val: number) => ((val - chartLow) / chartRange) * 100;

  /*
   * Detect when labels would overlap and merge them into a
   * staggered layout. Two labels overlap when they're within ~12% of
   * the chart width.
   */
  const OVERLAP_THRESHOLD = 12; // percent

  interface Marker {
    value: number;
    label: string;
    pos: number;
    isPrimary?: boolean;
  }

  const markers: Marker[] = [
    { value: low, label: formatCurrency(low), pos: toPercent(low) },
    { value: p25, label: formatCurrency(p25), pos: toPercent(p25) },
    { value: median, label: formatCurrency(median), pos: toPercent(median), isPrimary: true },
    { value: p75, label: formatCurrency(p75), pos: toPercent(p75) },
    { value: high, label: formatCurrency(high), pos: toPercent(high) },
  ];

  // Assign alternating vertical offsets to markers that are too close
  const markerRows: number[] = new Array(markers.length).fill(0);
  for (let i = 1; i < markers.length; i++) {
    if (markers[i].pos - markers[i - 1].pos < OVERLAP_THRESHOLD) {
      markerRows[i] = markerRows[i - 1] === 0 ? 1 : 0;
    }
  }

  const hasStagger = markerRows.some((r) => r === 1);
  const valueRowHeight = hasStagger ? 36 : 20;

  return (
    <div className={compact ? 'py-2' : 'py-4'}>
      {label && <p className="text-sm font-medium text-text-muted mb-3">{label}</p>}

      {/* Percentile labels (25th, Median, 75th) */}
      <div className="relative h-5 mb-0.5">
        {[
          { value: p25, label: '25th' },
          { value: median, label: 'Median' },
          { value: p75, label: '75th' },
        ].map((marker) => (
          <div
            key={marker.label}
            className="absolute -translate-x-1/2 text-center"
            style={{ left: `${toPercent(marker.value)}%` }}
          >
            <span className="text-[10px] text-text-muted whitespace-nowrap">{marker.label}</span>
          </div>
        ))}
      </div>

      {/* Value labels — staggered when needed */}
      <div className="relative mb-1" style={{ height: `${valueRowHeight}px` }}>
        {markers.map((marker, i) => (
          <div
            key={i}
            className="absolute -translate-x-1/2 text-center"
            style={{
              left: `${marker.pos}%`,
              top: markerRows[i] === 1 ? '16px' : '0px',
            }}
          >
            <span
              className={`text-xs font-semibold whitespace-nowrap ${
                marker.isPrimary ? 'text-primary' : 'text-text'
              }`}
            >
              {marker.label}
            </span>
          </div>
        ))}
      </div>

      {/* Range bar */}
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        {/* IQR fill */}
        <div
          className="absolute h-full bg-gradient-to-r from-primary-light to-primary rounded-full"
          style={{
            left: `${toPercent(p25)}%`,
            width: `${toPercent(p75) - toPercent(p25)}%`,
          }}
        />
        {/* Median marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-primary rounded-full shadow-sm"
          style={{ left: `${toPercent(median)}%`, transform: 'translate(-50%, -50%)' }}
        />
        {/* Average marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-primary-dark rounded-full"
          style={{ left: `${toPercent(average)}%`, transform: 'translate(-50%, -50%)' }}
        />
      </div>

      {/* Low / Avg / High summary */}
      {!compact && (
        <div className="flex justify-between mt-3 text-xs text-text-muted">
          <span>Low: {formatCurrency(low)}</span>
          <span className="font-medium text-primary-dark">Avg: {formatCurrency(average)}</span>
          <span>High: {formatCurrency(high)}</span>
        </div>
      )}
    </div>
  );
}
