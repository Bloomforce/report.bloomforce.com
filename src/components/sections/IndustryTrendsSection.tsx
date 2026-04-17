'use client';

import { motion } from 'framer-motion';
import { Brain, GitMerge, Building2 } from 'lucide-react';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { Badge } from '@/components/ui/Badge';
import { SECTION_IDS } from '@/lib/constants';
import { getTrends } from '@/lib/data';
import { staggerContainer, fadeInUp } from '@/lib/animations';

const iconMap: Record<string, React.ElementType> = {
  'ai-adoption': Brain,
  'mergers-acquisitions': GitMerge,
  'org-structure': Building2,
};

export function IndustryTrendsSection() {
  const trends = getTrends();

  return (
    <SectionWrapper id={SECTION_IDS.trends} alt>
      <div className="text-center mb-12">
        <Badge className="mb-4">Industry Trends</Badge>
        <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-heading)] text-navy mb-4">
          What&apos;s shaping healthcare IT
        </h2>
        <p className="text-text-muted max-w-2xl mx-auto">
          AI adoption, M&amp;A impact, and evolving organizational structures in the EHR ecosystem.
        </p>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {trends.map((trend) => {
          const Icon = iconMap[trend.trendId] || Brain;
          return (
            <motion.div
              key={trend.trendId}
              variants={fadeInUp}
              className="bg-white rounded-xl border border-ink/10 shadow-sm shadow-ink/[0.03] p-6 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-primary" />
              </div>

              <h3 className="text-lg font-[family-name:var(--font-heading)] text-navy mb-2">
                {trend.title}
              </h3>

              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-3xl font-[family-name:var(--font-heading)] text-primary">
                  {trend.headlineStat}
                </span>
                <span className="text-lg text-primary">{trend.unit}</span>
              </div>

              <p className="text-sm text-text-muted mb-4">{trend.description}</p>

              <ul className="space-y-2">
                {trend.details.slice(0, 3).map((detail, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-text-muted">
                    <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </motion.div>
    </SectionWrapper>
  );
}
