'use client';

import { Laptop, Building2, Home } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { Sparkline } from '@/components/charts/Sparkline';
import { DemandHeat } from '@/components/charts/DemandHeat';
import { MarketPulseFeed } from '@/components/live/MarketPulseFeed';
import { DeltaTag } from '@/components/live/DeltaTag';
import { useBenchmark } from '@/hooks/useBenchmark';
import { formatK } from '@/lib/insights/format';
import { SECTION_IDS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { WorkModel } from '@/lib/insights/types';

const WM_META: Record<WorkModel, { label: string; icon: typeof Laptop }> = {
  remote: { label: 'Fully remote', icon: Laptop },
  hybrid: { label: 'Hybrid', icon: Home },
  onsite: { label: 'On-site', icon: Building2 },
};

export function MarketTerminalSection() {
  const { data, familyRows, roleName, profile } = useBenchmark();

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

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          {/* posted-market momentum */}
          <div className="bg-white rounded-2xl border border-ink/10 shadow-sm shadow-ink/[0.03] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-[family-name:var(--font-heading)] font-semibold text-navy">
                Where the market stands · {roleName}
              </h3>
              <span className="text-[11px] text-text-light font-[family-name:var(--font-mono)] uppercase tracking-wider">national · all levels</span>
            </div>
            {national ? (
              <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
                <div>
                  <div className="text-xs text-text-muted uppercase tracking-wide font-semibold mb-1">Benchmark median now</div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl font-bold text-navy font-[family-name:var(--font-mono)] tabular-nums">
                      {formatK(national.blended.p50)}
                    </span>
                    {national.medianDelta90d !== null && <DeltaTag value={national.medianDelta90d} period="90d" />}
                  </div>
                </div>
                {national.spark && national.spark.length >= 4 && (
                  <div className="flex-1 min-w-[220px]">
                    <div className="text-xs text-text-muted uppercase tracking-wide font-semibold mb-1">
                      Advertised pay in job postings · 12 mo
                    </div>
                    <Sparkline data={national.spark} width={260} height={56} fill />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-muted">Not enough market data for this role yet.</p>
            )}

            {/* work model cards */}
            {wmCuts.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-6">
                {(['remote', 'hybrid', 'onsite'] as WorkModel[]).map((wm) => {
                  const cut = wmCuts.find((c) => c.workModel === wm);
                  const Icon = WM_META[wm].icon;
                  return (
                    <div key={wm} className="border border-ink/10 rounded-xl p-4 text-center">
                      <Icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
                      <div className={cn('font-bold text-navy font-[family-name:var(--font-mono)] tabular-nums', cut ? 'text-lg' : 'text-xs text-text-light font-normal')}>
                        {cut ? formatK(cut.blended.p50) : 'not enough data yet'}
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">{WM_META[wm].label}</div>
                      {cut && <div className="text-[10px] text-text-light mt-1">{cut.n} reports</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DemandHeat cells={data.demand} />
        </div>

        <MarketPulseFeed items={data.pulse} />
      </div>

    </SectionWrapper>
  );
}
