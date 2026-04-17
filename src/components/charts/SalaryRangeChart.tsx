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
  const range = high - low;
  const toPercent = (val: number) => ((val - low) / range) * 100;

  return (
    <div className={compact ? 'py-2' : 'py-4'}>
      {label && <p className="text-sm font-medium text-text-muted mb-3">{label}</p>}

      {/* Marker labels */}
      <div className="relative h-6 mb-1">
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
            <span className="text-[10px] text-text-muted">{marker.label}</span>
          </div>
        ))}
      </div>

      {/* Value labels */}
      <div className="relative h-5 mb-1">
        {[
          { value: low, pos: 0 },
          { value: p25, pos: toPercent(p25) },
          { value: median, pos: toPercent(median) },
          { value: p75, pos: toPercent(p75) },
          { value: high, pos: 100 },
        ].map((marker, i) => (
          <div
            key={i}
            className="absolute -translate-x-1/2 text-center"
            style={{ left: `${marker.pos}%` }}
          >
            <span className={`text-xs font-semibold ${marker.value === median ? 'text-primary' : 'text-text'}`}>
              {formatCurrency(marker.value)}
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

      {/* Average label */}
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
