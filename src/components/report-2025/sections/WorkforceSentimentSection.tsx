'use client';

import { motion } from 'framer-motion';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { Badge } from '@/components/ui/Badge';
import { DonutChart } from '@/components/charts/DonutChart';
import { HorizontalBarChart } from '@/components/charts/HorizontalBarChart';
import { GatedContent } from '@/components/gate/GatedContent';
import { SECTION_IDS } from '@/lib/constants';
import { getFreeSentiment, getGatedSentiment } from '@/lib/data';
import { staggerContainer, fadeInUp } from '@/lib/animations';

function SentimentCard({ title, stat, unit, children }: { title: string; stat: number; unit: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-ink/10 shadow-sm shadow-ink/[0.03] p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h4 className="text-sm font-semibold text-navy">{title}</h4>
        <span className="text-2xl font-[family-name:var(--font-heading)] text-primary">
          {stat}{unit}
        </span>
      </div>
      {children}
    </div>
  );
}

export function WorkforceSentimentSection() {
  const free = getFreeSentiment();
  const gated = getGatedSentiment();

  const remoteWork = free.find((c) => c.categoryId === 'remote-work');
  const rtoResponse = free.find((c) => c.categoryId === 'rto-response');
  const managerView = free.find((c) => c.categoryId === 'manager-productivity');
  const wlb = free.find((c) => c.categoryId === 'work-life-balance');
  const recognition = free.find((c) => c.categoryId === 'recognition');

  return (
    <SectionWrapper id={SECTION_IDS.sentiment} dark>
      <div className="text-center mb-12">
        <Badge className="mb-4">Workforce Insights</Badge>
        <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-heading)] text-white mb-4">
          What people are feeling behind the work
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Remote work, satisfaction, recognition, and career sentiment from healthcare IT professionals.
        </p>
      </div>

      {/* Free insights */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
      >
        {remoteWork && (
          <motion.div variants={fadeInUp}>
            <SentimentCard title="Remote Work" stat={remoteWork.headlineStat} unit="%">
              <DonutChart
                data={remoteWork.dataPoints}
                centerValue="64%"
                centerLabel="Remote"
                size={170}
              />
            </SentimentCard>
          </motion.div>
        )}

        {rtoResponse && (
          <motion.div variants={fadeInUp}>
            <SentimentCard title="RTO Response" stat={rtoResponse.headlineStat} unit="%">
              <p className="text-sm text-text-muted mb-3">
                How workers would respond to an RTO mandate:
              </p>
              <HorizontalBarChart data={rtoResponse.dataPoints} />
            </SentimentCard>
          </motion.div>
        )}

        {managerView && (
          <motion.div variants={fadeInUp}>
            <SentimentCard title="Manager Perspective" stat={managerView.headlineStat} unit="%">
              <DonutChart
                data={managerView.dataPoints}
                centerValue="85%"
                centerLabel="Productive"
                size={170}
              />
            </SentimentCard>
          </motion.div>
        )}

        {wlb && (
          <motion.div variants={fadeInUp}>
            <SentimentCard title="Work-Life Balance" stat={wlb.headlineStat} unit="%">
              <div className="space-y-3">
                {wlb.dataPoints.map((dp) => (
                  <div key={dp.label} className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">{dp.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${dp.value}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-navy">{dp.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </SentimentCard>
          </motion.div>
        )}

        {recognition && (
          <motion.div variants={fadeInUp}>
            <SentimentCard title="Recognition" stat={recognition.headlineStat} unit="%">
              <DonutChart
                data={recognition.dataPoints}
                centerValue="74%"
                centerLabel="Recognized"
                size={170}
              />
            </SentimentCard>
          </motion.div>
        )}
      </motion.div>

      {/* Gated insights */}
      <GatedContent message="Request the full report for deeper workforce breakdowns by role, tenure, and more">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gated.map((category) => (
            <div key={category.categoryId} className="bg-white rounded-xl border border-ink/10 shadow-sm shadow-ink/[0.03] p-6">
              <h4 className="text-sm font-semibold text-navy mb-2">{category.categoryName}</h4>
              <p className="text-xs text-text-muted mb-4">{category.headline}</p>
              <HorizontalBarChart data={category.dataPoints} />
            </div>
          ))}
        </div>
      </GatedContent>
    </SectionWrapper>
  );
}
