'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { SECTION_IDS } from '@/lib/constants';
import { getHighlights } from '@/lib/data';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import { formatCurrency } from '@/lib/utils';

function HeroStat({ value, suffix, prefix, label }: { value: number; suffix: string; prefix?: string; label: string }) {
  const { count, ref } = useAnimatedCounter(value);
  const display = prefix === '$' ? formatCurrency(count) : `${prefix || ''}${count.toLocaleString()}${suffix}`;

  return (
    <div className="text-center">
      <span ref={ref} className="block text-2xl md:text-3xl font-[family-name:var(--font-heading)] text-primary">
        {display}
      </span>
      <span className="text-xs md:text-sm text-text-muted">{label}</span>
    </div>
  );
}

export function HeroSection() {
  const { heroStats } = getHighlights();

  return (
    <section id={SECTION_IDS.hero} className="relative pt-24 pb-12 md:pt-32 md:pb-20 px-4 overflow-hidden bg-bg">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-bg to-bg-subtle" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-3xl mx-auto text-center"
        >
          <motion.div variants={fadeInUp}>
            <Badge className="mb-6">2025 EHR Workforce Trends Report</Badge>
          </motion.div>

          <motion.h1 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-[family-name:var(--font-heading)] text-navy leading-tight mb-6">
            The data behind healthcare IT talent
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-lg md:text-xl text-text-muted leading-relaxed mb-8 max-w-2xl mx-auto">
            Salary benchmarks, workforce sentiment, and industry trends from 300+ healthcare IT professionals across Epic and EHR ecosystems.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Button size="lg" href={`#${SECTION_IDS.salaryExplorer}`}>
              Explore Salary Data
            </Button>
            <Button size="lg" variant="secondary" href={`#${SECTION_IDS.keyFindings}`}>
              View Key Findings
            </Button>
          </motion.div>
        </motion.div>

        {/* Hero stat counters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto bg-white rounded-2xl shadow-lg shadow-ink/[0.04] border border-ink/10 p-6 md:p-8"
        >
          {heroStats.map((stat) => (
            <HeroStat
              key={stat.id}
              value={stat.value}
              suffix={stat.suffix}
              prefix={stat.prefix}
              label={stat.label}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
