'use client';

import { ClipboardList, Radio, Landmark } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { LiveDot } from '@/components/live/LiveDot';
import { useBenchmark } from '@/hooks/useBenchmark';
import { formatDate } from '@/lib/insights/format';
import { SECTION_IDS } from '@/lib/constants';

export function MethodologyLiveSection() {
  const { data } = useBenchmark();
  const f = data.freshness;

  const layers = [
    {
      icon: ClipboardList,
      name: 'Our workforce surveys',
      trust: 'Highest trust',
      body: `${f.totalRespondents.toLocaleString()} verified responses from EHR professionals across two survey waves, screened for outliers and duplicates. The industry-leading survey in this space, and the backbone of every number here.`,
      fresh: f.lastSurveyIngest ? `last response ${formatDate(f.lastSurveyIngest)}` : null,
    },
    {
      icon: Radio,
      name: 'Market pulse',
      trust: 'Directional',
      body: 'Recent job postings and live hiring demand across the market, read continuously by role, level, and region. This is how the benchmark stays current between survey waves.',
      fresh: f.lastPulseRefresh ? `last refresh ${formatDate(f.lastPulseRefresh)}` : null,
    },
    {
      icon: Landmark,
      name: 'Verification layer',
      trust: 'Verified',
      body: 'Additional verified pay records keep the numbers honest, and no single employer is allowed to dominate any published figure.',
      fresh: null,
    },
  ];

  return (
    <SectionWrapper id={SECTION_IDS.methodology} alt>
      <div className="text-center mb-10">
        <Badge className="mb-4">Methodology</Badge>
        <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-heading)] text-navy mb-4">
          Where these numbers come from
        </h2>
        <p className="text-text-muted max-w-2xl mx-auto">
          Every benchmark starts with what real professionals told us they earn, kept current by what the
          market is actually hiring for. Every number carries its sample size, confidence, and date.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {layers.map((layer) => (
          <div key={layer.name} className="bg-white rounded-2xl border border-ink/10 shadow-sm shadow-ink/[0.03] p-6">
            <div className="flex items-center gap-2.5 mb-3">
              <layer.icon className="w-5 h-5 text-primary" />
              <h3 className="font-[family-name:var(--font-heading)] font-semibold text-navy">{layer.name}</h3>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-primary bg-primary-50 rounded-full px-2 py-0.5">
                {layer.trust}
              </span>
            </div>
            <p className="text-sm text-text-muted leading-relaxed">{layer.body}</p>
            {layer.fresh && (
              <p className="text-[11px] text-text-light mt-3 flex items-center gap-1.5">
                <LiveDot size={6} /> {layer.fresh}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-dashed border-ink/20 p-5 text-sm text-text-muted max-w-3xl mx-auto text-center">
        Rolling 12-month window. When a cut is too thin to trust, it is{' '}
        <span className="font-semibold text-navy">hidden, not guessed</span>, and estimates are always labeled
        as estimates. Updated {formatDate(f.asOf)}.
      </div>
    </SectionWrapper>
  );
}
