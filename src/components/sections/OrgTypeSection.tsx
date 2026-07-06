'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { SectionCTABand } from '@/components/sections/SectionCTABand';
import { useBenchmark } from '@/hooks/useBenchmark';
import { formatK } from '@/lib/insights/format';
import { EMPLOYER_TYPE_LABELS } from '@/lib/insights/employer-types';
import { SECTION_IDS } from '@/lib/constants';

/**
 * Same role, different employer: blended medians by organization type for the
 * hero-selected role family (National, all levels). Level- and region-specific
 * org-type cuts are call-only by design.
 */
export function OrgTypeSection() {
  const { familyRows, roleName } = useBenchmark();

  const cuts = familyRows
    .filter(
      (r) =>
        r.employerType !== 'all' &&
        r.workModel === 'all' &&
        r.region === 'National' &&
        r.seniority === 'ALL',
    )
    .sort((a, b) => b.blended.p50 - a.blended.p50);

  if (cuts.length < 2) return null;

  const spread = cuts[0].blended.p50 - cuts[cuts.length - 1].blended.p50;

  return (
    <SectionWrapper id={SECTION_IDS.orgType}>
      <div className="text-center mb-10">
        <Badge className="mb-4">Same role, different employer</Badge>
        <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-heading)] text-navy mb-4">
          Who signs the paycheck changes the paycheck
        </h2>
        <p className="text-text-muted max-w-2xl mx-auto">
          The same {roleName.toLowerCase()} role pays differently at a children&apos;s hospital than at an
          academic medical center or a multi-state system. Right now the gap runs about{' '}
          <span className="font-semibold text-navy">{formatK(spread)}</span> at the median.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 max-w-5xl mx-auto">
        {cuts.map((c, i) => (
          <motion.div
            key={c.employerType}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="bg-white rounded-2xl border border-ink/10 shadow-sm shadow-ink/[0.03] p-5 text-center"
          >
            <div className="text-xs text-text-muted font-semibold min-h-[32px] flex items-center justify-center">
              {EMPLOYER_TYPE_LABELS[c.employerType] ?? c.employerType}
            </div>
            <div className="text-2xl font-bold text-navy font-[family-name:var(--font-mono)] tabular-nums mt-1.5">
              {formatK(c.blended.p50)}
            </div>
            <div className="text-[11px] text-text-light mt-1.5">
              median · {c.n} reports{c.n < 10 ? ' · small sample' : ''}
            </div>
          </motion.div>
        ))}
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
