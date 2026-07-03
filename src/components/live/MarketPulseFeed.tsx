'use client';

import { motion } from 'framer-motion';
import { Activity, Database, TrendingUp, Newspaper } from 'lucide-react';
import { DeltaTag } from '@/components/live/DeltaTag';
import { useBenchmark } from '@/hooks/useBenchmark';
import { relativeTime } from '@/lib/insights/format';
import { cn } from '@/lib/utils';
import type { PulseItem } from '@/lib/insights/types';

const KIND_ICON: Record<PulseItem['kind'], typeof Activity> = {
  benchmark_move: TrendingUp,
  demand_shift: Activity,
  new_data: Database,
  industry_news: Newspaper,
};

export function MarketPulseFeed({ items }: { items: PulseItem[] }) {
  const { profile } = useBenchmark();
  return (
    <div className="bg-white rounded-2xl border border-ink/10 shadow-sm shadow-ink/[0.03] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-[family-name:var(--font-heading)] font-semibold text-navy">Market pulse</h3>
        <span className="text-[11px] text-text-light font-[family-name:var(--font-mono)] uppercase tracking-wider">auto-generated · weekly</span>
      </div>
      <div className="flex flex-col">
        {items.slice(0, 6).map((item, i) => {
          const Icon = KIND_ICON[item.kind];
          const mine = item.roleKey === profile.roleKey;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                'flex gap-3 py-3 border-b border-ink/5 last:border-0 items-start',
                mine && 'bg-primary-50/60 -mx-3 px-3 rounded-lg border-l-2 border-l-primary',
              )}
            >
              <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-navy leading-snug">
                  {item.text}
                  {mine && <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-primary">your role</span>}
                </p>
                <div className="flex items-center gap-2.5 mt-1">
                  <span className="text-[11px] text-text-light font-[family-name:var(--font-mono)]">{relativeTime(item.ts)}</span>
                  {item.deltaValue !== undefined && item.deltaUnit && (
                    <DeltaTag value={item.deltaValue} unit={item.deltaUnit} />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
