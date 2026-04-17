'use client';

import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { Badge } from '@/components/ui/Badge';
import { SECTION_IDS } from '@/lib/constants';
import { getMethodology } from '@/lib/data';

export function MethodologySection() {
  const data = getMethodology();

  const stats = [
    { value: `${data.totalResponses}+`, label: 'Respondents' },
    { value: `${data.epicPercentage}%`, label: 'Work in Epic' },
    { value: `${data.healthSystemPercentage}%`, label: 'Health System Employees' },
    { value: `${data.genderSplit.female}/${data.genderSplit.male}`, label: 'Female / Male' },
  ];

  return (
    <SectionWrapper id={SECTION_IDS.methodology}>
      <div className="text-center mb-8">
        <Badge variant="muted" className="mb-4">Methodology</Badge>
        <h2 className="text-2xl md:text-3xl font-[family-name:var(--font-heading)] text-navy mb-3">
          About this survey
        </h2>
        <p className="text-sm text-text-muted max-w-xl mx-auto">
          The EHR Salary Insights Survey was completed online between {data.surveyPeriod}. Findings are indicative rather than conclusive.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center bg-white rounded-xl border border-ink/10 p-4">
            <span className="block text-2xl font-[family-name:var(--font-heading)] text-primary mb-1">
              {stat.value}
            </span>
            <span className="text-xs text-text-muted">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3 mt-6">
        {data.experienceDistribution.map((exp) => (
          <div key={exp.label} className="flex items-center gap-2 bg-bg-subtle rounded-full px-3 py-1.5">
            <span className="text-xs font-medium text-navy">{exp.label}</span>
            <span className="text-xs text-text-muted">{exp.value}%</span>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
