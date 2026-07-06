'use client';

import { Laptop, Building2, Home, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { Sparkline } from '@/components/charts/Sparkline';
import { DemandHeat } from '@/components/charts/DemandHeat';
import { MarketPulseFeed } from '@/components/live/MarketPulseFeed';
import { DeltaTag } from '@/components/live/DeltaTag';
import { LiveDot } from '@/components/live/LiveDot';
import { useBenchmark } from '@/hooks/useBenchmark';
import { formatK, relativeTime } from '@/lib/insights/format';
import { SECTION_IDS, BOOK_CALL_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { WorkModel } from '@/lib/insights/types';

const WM_META: Record<WorkModel, { label: string; icon: typeof Laptop }> = {
  remote: { label: 'Fully remote', icon: Laptop },
  hybrid: { label: 'Hybrid', icon: Home },
  onsite: { label: 'On-site', icon: Building2 },
};

export function MarketTerminalSection() {
  const { data, familyRows, roleName, guardedRole } = useBenchmark();

  // National family cell carries the market-trend fields
  const national = familyRows.find(
    (r) => r.seniority === 'ALL' && r.region === 'National' && r.workModel === 'all' && r.employerType === 'all',
  );
  const wmCuts = familyRows.filter(
    (r) => r.seniority === 'ALL' && r.region === 'National' && r.workModel !== 'all' && r.employerType === 'all',
  );

  return (
    <SectionWrapper id={SECTION_IDS.terminal} alt>
      <div className="text-center mb-10">
        <Badge className="mb-4">Bloomforce Market in Motion&trade;</Badge>
        <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-heading)] text-navy mb-4">
          What the market is doing right now
        </h2>
        <p className="text-text-muted max-w-2xl mx-auto">
          Live hiring demand from recent job postings: what employers are advertising, where demand is moving,
          and what changed this week.
        </p>
      </div>

      {/* The terminal */}
      <div className="rounded-3xl bg-navy-deep text-white shadow-xl shadow-navy/25 ring-1 ring-white/10 overflow-hidden bg-[radial-gradient(800px_360px_at_15%_-10%,rgba(0,168,150,0.14),transparent)]">
        {/* header strip */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 md:px-8 py-4 border-b border-white/10">
          <span className="inline-flex items-center gap-2.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.22em] text-primary-light">
            <LiveDot size={7} />
            Bloomforce Market in Motion&trade;
          </span>
          <span className="ml-auto font-[family-name:var(--font-mono)] text-[11px] text-white/40 uppercase tracking-wider">
            refreshed {relativeTime(data.freshness.lastPulseRefresh)} · rolling 12 mo
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-5 p-5 md:p-7">
          <div className="flex flex-col gap-5">
            {/* market snapshot for the selected role */}
            <div className="rounded-2xl bg-white/[0.04] ring-1 ring-white/10 p-6">
              <div className="flex items-center justify-between mb-4 gap-3">
                <h3 className="text-base font-[family-name:var(--font-heading)] font-semibold text-white truncate">
                  {roleName}
                </h3>
                <span className="text-[11px] text-white/40 font-[family-name:var(--font-mono)] uppercase tracking-wider shrink-0">
                  national · all levels
                </span>
              </div>
              {guardedRole ? (
                <div className="flex items-start gap-3 py-2">
                  <Lock className="w-4 h-4 text-primary-light mt-0.5 shrink-0" />
                  <p className="text-sm text-white/70">
                    {roleName} market data is available on request.{' '}
                    <a
                      href={`${BOOK_CALL_URL}?utm_source=insights&utm_content=terminal-guarded`}
                      className="text-primary-light underline underline-offset-2 hover:text-white transition-colors"
                    >
                      Request access to the leadership data set
                    </a>
                    .
                  </p>
                </div>
              ) : national ? (
                <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
                  <div>
                    <div className="text-[11px] text-white/45 uppercase tracking-wide font-semibold mb-1">Benchmark median now</div>
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-3xl font-bold text-white font-[family-name:var(--font-mono)] tabular-nums">
                        {formatK(national.blended.p50)}
                      </span>
                      {national.medianDelta90d !== null && <DeltaTag value={national.medianDelta90d} period="90d" />}
                    </div>
                  </div>
                  {national.spark && national.spark.length >= 4 && (
                    <div className="flex-1 min-w-[220px]">
                      <div className="text-[11px] text-white/45 uppercase tracking-wide font-semibold mb-1">
                        Advertised pay in job postings · 12 mo
                      </div>
                      <Sparkline data={national.spark} width={260} height={56} fill stroke="#3BC3B4" />
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-white/60">Not enough market data for this role yet.</p>
              )}

              {/* work model cards */}
              {!guardedRole && wmCuts.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {(['remote', 'hybrid', 'onsite'] as WorkModel[]).map((wm) => {
                    const cut = wmCuts.find((c) => c.workModel === wm);
                    const Icon = WM_META[wm].icon;
                    return (
                      <div key={wm} className="rounded-xl bg-white/[0.04] ring-1 ring-white/10 p-4 text-center">
                        <Icon className="w-4 h-4 text-primary-light mx-auto mb-1.5" />
                        <div className={cn('font-bold text-white font-[family-name:var(--font-mono)] tabular-nums', cut ? 'text-lg' : 'text-xs text-white/40 font-normal')}>
                          {cut ? formatK(cut.blended.p50) : 'not enough data yet'}
                        </div>
                        <div className="text-xs text-white/50 mt-0.5">{WM_META[wm].label}</div>
                        {cut && <div className="text-[10px] text-white/35 mt-1">{cut.n} reports</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <DemandHeat cells={data.demand} dark />
          </div>

          <MarketPulseFeed items={data.pulse} dark />
        </div>
      </div>
    </SectionWrapper>
  );
}
