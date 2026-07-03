'use client';

import { motion } from 'framer-motion';
import type { Percentiles } from '@/lib/insights/types';
import { estimatePercentile, percentileLabel } from '@/lib/insights/percentile';
import { formatK } from '@/lib/insights/format';

interface PercentileTrackProps {
  percentiles: Percentiles;
  /** Visitor's comp — renders the "you" marker when set. */
  comp?: number;
  height?: number;
}

/**
 * The hero chart: a p10–p90 band with tick callouts and an animated "YOU"
 * marker. Pure SVG; positions are percent-of-width so it scales fluidly.
 */
export function PercentileTrack({ percentiles: p, comp }: PercentileTrackProps) {
  // Pad the domain so p10/p90 don't sit at the extreme edges
  const domainLo = p.p10 - (p.p90 - p.p10) * 0.12;
  const domainHi = p.p90 + (p.p90 - p.p10) * 0.12;
  const x = (v: number) => Math.min(99, Math.max(1, ((v - domainLo) / (domainHi - domainLo)) * 100));

  const youPct = comp !== undefined ? estimatePercentile(comp, p) : null;
  const youX = comp !== undefined ? x(Math.min(Math.max(comp, domainLo), domainHi)) : null;

  const ticks = [
    { v: p.p25, label: 'p25', strong: false },
    { v: p.p50, label: 'median', strong: true },
    { v: p.p75, label: 'p75', strong: false },
  ];

  return (
    <div className="relative w-full select-none" style={{ paddingTop: comp !== undefined ? 44 : 12, paddingBottom: 46 }}>
      {/* the band */}
      <div
        className="relative h-4 rounded-full"
        style={{
          background: `linear-gradient(90deg, #dbe6f0, #bfe9e2 45%, var(--color-primary-light) 78%, var(--color-primary))`,
        }}
      >
        {ticks.map((t) => (
          <div key={t.label}>
            <div
              className="absolute w-0.5 bg-navy"
              style={{ left: `${x(t.v)}%`, top: -5, height: 26, opacity: t.strong ? 0.85 : 0.4 }}
            />
            <div
              className="absolute text-xs text-text-muted whitespace-nowrap"
              style={{ left: `${x(t.v)}%`, top: 30, transform: 'translateX(-50%)' }}
            >
              <span className={t.strong ? 'font-semibold text-navy' : ''}>
                {t.label} {formatK(t.v)}
              </span>
            </div>
          </div>
        ))}

        {youX !== null && youPct !== null && (
          <motion.div
            className="absolute"
            initial={false}
            animate={{ left: `${youX}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 18 }}
            style={{ top: 0 }}
          >
            <div
              className="absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-navy text-white text-[11px] font-semibold px-2.5 py-1"
              style={{ top: -36 }}
            >
              You · {percentileLabel(youPct).replace('≈ ', '')}
              <span
                className="absolute left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy"
                style={{ top: '100%' }}
              />
            </div>
            <div
              className="absolute -translate-x-1/2 bg-navy rounded-sm"
              style={{ width: 10, height: 24, top: -4, transform: 'translateX(-50%) rotate(45deg) scale(0.72, 0.72)' }}
            />
            <div
              className="absolute -translate-x-1/2 bg-navy rounded-[3px]"
              style={{ width: 8, height: 22, top: -3 }}
            />
          </motion.div>
        )}
      </div>

      {/* domain ends */}
      <div className="absolute bottom-1 left-0 text-[11px] text-text-light">p10 {formatK(p.p10)}</div>
      <div className="absolute bottom-1 right-0 text-[11px] text-text-light">p90 {formatK(p.p90)}</div>
    </div>
  );
}
