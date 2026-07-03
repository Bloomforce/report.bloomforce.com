'use client';

import { LiveDot } from '@/components/live/LiveDot';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { formatDate } from '@/lib/insights/format';
import type { FreshnessMeta } from '@/lib/insights/types';

function Counter({ value }: { value: number }) {
  const { count, ref } = useAnimatedCounter(value, 1400);
  return (
    <span ref={ref} className="font-[family-name:var(--font-mono)] tabular-nums font-medium text-white">
      {count.toLocaleString()}
    </span>
  );
}

export function FreshnessBar({ meta }: { meta: FreshnessMeta }) {
  return (
    <div className="sticky top-0 z-50 bg-navy-deep text-[13px] text-white/70">
      <div className="max-w-6xl mx-auto px-4 h-[38px] flex items-center gap-x-4 overflow-hidden whitespace-nowrap">
        <span className="inline-flex items-center gap-2 font-semibold tracking-[0.06em] text-white">
          <LiveDot size={9} />
          LIVE
        </span>
        <span className="hidden sm:inline">
          <Counter value={meta.totalRespondents} /> professionals · <Counter value={meta.postingsIngested} /> postings
        </span>
        <span className="sm:hidden">
          <Counter value={meta.benchmarkCells} /> live benchmarks
        </span>
        <span className="hidden md:inline text-white/30">·</span>
        <span className="hidden md:inline">{meta.windowLabel}</span>
        <span className="ml-auto">
          as of <span className="text-white">{formatDate(meta.asOf)}</span>
        </span>
      </div>
    </div>
  );
}
