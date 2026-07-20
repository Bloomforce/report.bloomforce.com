'use client';

/**
 * Shared building blocks for the scrollytelling homepage candidates at
 * /preview/briefing and /preview/fit. Everything renders from live
 * InsightsData — no hardcoded survey numbers.
 */

import { useEffect, useRef } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import type { BenchmarkRow, InsightsData, SentimentCut } from '@/lib/insights/types';

export const fmtK = (n: number | null | undefined): string =>
  n == null ? '—' : `$${Math.round(n / 1000)}K`;

export const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function cut(data: InsightsData, metricKey: string): SentimentCut | undefined {
  return data.sentiment.find((s) => s.metricKey === metricKey);
}

/** Percentage (0–100, rounded) for one answer key inside a sentiment cut. */
export function pct(c: SentimentCut | undefined, ...keys: string[]): number {
  if (!c) return 0;
  const sum = c.values.filter((v) => keys.includes(v.key)).reduce((a, v) => a + v.value, 0);
  return Math.round(sum * 100);
}

/** YoY delta in points for one answer key, or null. */
export function pctDelta(c: SentimentCut | undefined, key: string): number | null {
  const d = c?.values.find((v) => v.key === key)?.deltaYoY;
  return d == null ? null : Math.round(d * 100);
}

/** True for the blended "everything" cut of a row (no work-model/employer slice). */
export function isBlendedCut(b: BenchmarkRow): boolean {
  return b.module === 'all' && b.workModel === 'all' && b.employerType === 'all';
}

/** The blended national all-seniority row for a role family. */
export function overall(
  data: InsightsData,
  roleFamily: string,
  region = 'National'
): BenchmarkRow | undefined {
  return data.benchmarks.find(
    (b) =>
      b.roleFamily === roleFamily && b.seniority === 'ALL' && b.region === region && isBlendedCut(b)
  );
}

/** National ALL rows, deduped to one per role family, sorted by median desc. */
export function ladder(data: InsightsData): BenchmarkRow[] {
  const seen = new Set<string>();
  return data.benchmarks
    .filter((b) => b.seniority === 'ALL' && b.region === 'National' && isBlendedCut(b))
    .filter((b) => (seen.has(b.roleFamily) ? false : (seen.add(b.roleFamily), true)))
    .sort((a, b) => b.blended.p50 - a.blended.p50);
}

/** Count-up number that animates when scrolled into view. */
export function Count({
  to,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1.3,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!inView) return;
    if (reduced) {
      el.textContent = `${prefix}${to.toFixed(decimals)}${suffix}`;
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => {
        el.textContent = `${prefix}${v.toFixed(decimals)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, to, prefix, suffix, decimals, duration, reduced]);

  return (
    <span ref={ref}>
      {prefix}
      {(0).toFixed(decimals)}
      {suffix}
    </span>
  );
}

/** Scroll-in reveal wrapper. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/** Horizontal bar fill that grows into view. */
export function GrowBar({
  widthPct,
  className,
  delay = 0,
}: {
  widthPct: number;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      style={{ width: `${widthPct}%` }}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay, transformOrigin: 'left' } as never}
    />
  );
}
