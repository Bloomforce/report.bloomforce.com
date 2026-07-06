'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { SectionCTABand } from '@/components/sections/SectionCTABand';
import { GatedContent } from '@/components/gate/GatedContent';
import { useBenchmark } from '@/hooks/useBenchmark';
import { formatK } from '@/lib/insights/format';
import { EMPLOYER_TYPE_LABELS } from '@/lib/insights/employer-types';
import { SECTION_IDS } from '@/lib/constants';

/**
 * Same role, different employer: benchmark medians by organization type for
 * the hero-selected role family (National, all levels). Gated behind the
 * email unlock; level- and region-specific org-type cuts stay call-only.
 */
export function OrgTypeSection() {
  const { familyRows, roleName, guardedRole } = useBenchmark();

  const cuts = familyRows
    .filter(
      (r) =>
        r.employerType !== 'all' &&
        r.workModel === 'all' &&
        r.region === 'National' &&
        r.seniority === 'ALL',
    )
    .sort((a, b) => b.blended.p50 - a.blended.p50);

  if (guardedRole || cuts.length < 2) return null;

  const top = cuts[0].blended.p50;
  const bottom = cuts[cuts.length - 1].blended.p50;
  const spread = top - bottom;

  return (
    <SectionWrapper id={SECTION_IDS.orgType}>
      <div className="text-center mb-10">
        <Badge className="mb-4">Same role, different employer</Badge>
        <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-heading)] text-navy mb-4">
          Who signs the paycheck changes the paycheck
        </h2>
        <p className="text-text-muted max-w-2xl mx-auto">
          The same {roleName.toLowerCase()} role pays differently at a children&apos;s hospital than at an
          academic medical center or a multi-state system. Right now that gap runs about{' '}
          <span className="font-semibold text-navy">{formatK(spread)}</span> at the median.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <GatedContent message="Unlock the org-type breakdown for every role on this page">
          <div className="bg-white rounded-2xl border border-ink/10 shadow-sm shadow-ink/[0.03] p-6 md:p-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-[family-name:var(--font-heading)] font-semibold text-navy">
                {roleName} · median by organization type
              </h3>
              <span className="text-[11px] text-text-light font-[family-name:var(--font-mono)] uppercase tracking-wider">
                national · all levels
              </span>
            </div>
            <div className="flex flex-col gap-3.5">
              {cuts.map((c, i) => {
                const rel = c.blended.p50 / top;
                return (
                  <div key={c.employerType} className="grid grid-cols-[150px_1fr_86px] sm:grid-cols-[200px_1fr_92px] items-center gap-3">
                    <span className="text-[13px] text-navy truncate">
                      {EMPLOYER_TYPE_LABELS[c.employerType] ?? c.employerType}
                    </span>
                    <span className="h-6 rounded-md bg-bg-subtle overflow-hidden">
                      <motion.span
                        className="block h-full rounded-md bg-gradient-to-r from-primary to-primary-light"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.round(rel * 100)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: i * 0.07, ease: 'easeOut' }}
                      />
                    </span>
                    <span className="text-right">
                      <span className="block text-[15px] font-bold text-navy font-[family-name:var(--font-mono)] tabular-nums">
                        {formatK(c.blended.p50)}
                      </span>
                      <span className="block text-[10px] text-text-light">
                        {c.n} reports{c.n < 10 ? ' · small sample' : ''}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-text-light mt-5">
              Medians combine verified professional reports with live market data for the selected role.
            </p>
          </div>
        </GatedContent>
      </div>

      <SectionCTABand
        title="Want this by level and region for your org type?"
        subtitle="Those cuts exist. We walk through them in a data review, matched to your situation."
        buttonLabel="Book a data review"
        href={`#${SECTION_IDS.cta}`}
      />
    </SectionWrapper>
  );
}
