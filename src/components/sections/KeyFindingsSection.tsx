'use client';

import { motion } from 'framer-motion';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SECTION_IDS } from '@/lib/constants';
import { getHighlights } from '@/lib/data';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import { useGate } from '@/hooks/useGate';

export function KeyFindingsSection() {
  const { keyFindings } = getHighlights();
  const { showModal, isUnlocked } = useGate();

  return (
    <SectionWrapper id={SECTION_IDS.keyFindings}>
      <div className="text-center mb-12">
        <Badge className="mb-4">Key Findings</Badge>
        <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-heading)] text-navy mb-4">
          What 300+ healthcare IT professionals told us
        </h2>
        <p className="text-text-muted max-w-2xl mx-auto">
          High-level insights from the 2025 EHR Workforce Trends survey covering compensation, satisfaction, and industry direction.
        </p>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {keyFindings.map((stat) => (
          <motion.div key={stat.id} variants={fadeInUp}>
            <StatCard
              value={stat.value}
              suffix={stat.suffix}
              prefix={stat.prefix}
              label={stat.label}
              icon={stat.icon}
            />
          </motion.div>
        ))}
      </motion.div>

      {!isUnlocked && (
        <div className="text-center mt-10">
          <p className="text-text-muted mb-4">
            Want detailed breakdowns by role, experience, and location?
          </p>
          <Button onClick={showModal}>Request Full Report</Button>
        </div>
      )}
    </SectionWrapper>
  );
}
