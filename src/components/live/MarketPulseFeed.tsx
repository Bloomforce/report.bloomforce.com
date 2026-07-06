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

export function MarketPulseFeed({ items, dark = false }: { items: PulseItem[]; dark?: boolean }) {
  const { profile } = useBenchmark();
  return (
    <div
      className={cn(
        'rounded-2xl p-6',
        dark ? 'bg-white/[0.04] ring-1 ring-white/10' : 'bg-white border border-ink/10 shadow-sm shadow-ink/[0.03]',
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={cn('text-base font-[family-name:var(--font-heading)] font-semibold', dark ? 'text-white' : 'text-navy')}>
          Market pulse
        </h3>
        <span className={cn('text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-wider', dark ? 'text-white/40' : 'text-text-light')}>
          auto-generated · weekly
        </span>
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
                'flex gap-3 py-3 items-start border-b last:border-0',
                dark ? 'border-white/[0.07]' : 'border-ink/5',
                mine &&
                  (dark
                    ? 'bg-primary/15 -mx-3 px-3 rounded-lg border-l-2 border-l-primary-light'
                    : 'bg-primary-50/60 -mx-3 px-3 rounded-lg border-l-2 border-l-primary'),
              )}
            >
              <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', dark ? 'text-primary-light' : 'text-primary')} />
              <div className="min-w-0">
                <p className={cn('text-sm leading-snug', dark ? 'text-white/85' : 'text-navy')}>
                  {item.text}
                  {mine && (
                    <span className={cn('ml-2 text-[10px] font-bold uppercase tracking-wide', dark ? 'text-primary-light' : 'text-primary')}>
                      your role
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2.5 mt-1">
                  <span className={cn('text-[11px] font-[family-name:var(--font-mono)]', dark ? 'text-white/35' : 'text-text-light')}>
                    {relativeTime(item.ts)}
                  </span>
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
