'use client';

import { useBenchmark } from '@/hooks/useBenchmark';
import { cn } from '@/lib/utils';
import type { DemandCell } from '@/lib/insights/types';

/**
 * Relative demand heat by role family — shares only (exact counts are a
 * Tier 2 unlock). A CSS-grid strip, not a chart library.
 */
export function DemandHeat({ cells, dark = false }: { cells: DemandCell[]; dark?: boolean }) {
  const { profile, setProfile } = useBenchmark();
  const max = Math.max(...cells.map((c) => c.share), 0.01);

  return (
    <div
      className={cn(
        'rounded-2xl p-6',
        dark ? 'bg-white/[0.04] ring-1 ring-white/10' : 'bg-white border border-ink/10 shadow-sm shadow-ink/[0.03]',
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={cn('text-base font-[family-name:var(--font-heading)] font-semibold', dark ? 'text-white' : 'text-navy')}>
          Where demand sits
        </h3>
        <span className={cn('text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-wider', dark ? 'text-white/40' : 'text-text-light')}>
          share of open Epic-IT roles · 12 mo
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {cells.slice(0, 8).map((c) => {
          const intensity = c.share / max;
          const selected = c.key === profile.roleKey;
          return (
            <button
              key={c.key}
              onClick={() => setProfile({ roleKey: c.key, seniority: 'ALL' })}
              className={cn(
                'grid grid-cols-[150px_1fr_64px] sm:grid-cols-[190px_1fr_72px] items-center gap-3 group text-left rounded-lg px-2 py-1 -mx-2 transition-colors',
                selected ? (dark ? 'bg-primary/15' : 'bg-primary-50') : dark ? 'hover:bg-white/[0.05]' : 'hover:bg-bg-subtle',
              )}
              title={`Set ${c.label} as your role`}
            >
              <span
                className={cn(
                  'text-[13px] truncate',
                  selected
                    ? dark
                      ? 'font-semibold text-primary-light'
                      : 'font-semibold text-primary-dark'
                    : dark
                      ? 'text-white/85'
                      : 'text-navy',
                )}
              >
                {c.label}
              </span>
              <span className={cn('h-5 rounded-md overflow-hidden', dark ? 'bg-white/[0.06]' : 'bg-bg-subtle')}>
                <span
                  className="block h-full rounded-md transition-all"
                  style={{
                    width: `${Math.max(4, (c.share / max) * 100)}%`,
                    backgroundColor: dark
                      ? `color-mix(in srgb, #3BC3B4 ${Math.round(35 + intensity * 65)}%, rgba(59,195,180,0.15))`
                      : `color-mix(in srgb, var(--color-primary) ${Math.round(30 + intensity * 70)}%, #E6F0EC)`,
                  }}
                />
              </span>
              <span className={cn('text-right text-[13px] font-semibold font-[family-name:var(--font-mono)] tabular-nums', dark ? 'text-white' : 'text-navy')}>
                {Math.round(c.share * 100)}%
                {c.delta30d !== null && (
                  <span className={cn('block text-[10px] font-medium', c.delta30d >= 0 ? 'text-[var(--color-up)]' : 'text-[var(--color-down)]')}>
                    {c.delta30d >= 0 ? '▲' : '▼'} {Math.abs(Math.round(c.delta30d * 100))} pts
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <p className={cn('text-[11px] mt-3', dark ? 'text-white/35' : 'text-text-light')}>
        Click a role to benchmark it. Exact opening counts and hotspots unlock with a contribution.
      </p>
    </div>
  );
}
