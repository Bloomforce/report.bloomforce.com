'use client';

import { CheckCircle, Calendar } from 'lucide-react';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { Button } from '@/components/ui/Button';
import { SECTION_IDS, CALENDLY_URL } from '@/lib/constants';

const valueProps = [
  'Salary benchmarks tailored to your roles and market',
  'Workforce sentiment trends shaping retention and hiring',
  'Competitive positioning data for your open requisitions',
  'Quarterly updates as new data comes in',
];

export function CTASection() {
  return (
    <SectionWrapper id={SECTION_IDS.cta} dark className="py-16 md:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left - value prop */}
        <div>
          <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-heading)] text-white mb-4">
            Get market insights tailored to your team
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            We'll walk you through the data that matters for your open roles — salary ranges, candidate availability, and what's shifting in your market.
          </p>

          <ul className="space-y-4 mb-8">
            {valueProps.map((prop) => (
              <li key={prop} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-gray-300">{prop}</span>
              </li>
            ))}
          </ul>

          <Button size="lg" href={CALENDLY_URL}>
            <Calendar className="w-4 h-4 mr-2" />
            Get Tailored Insights
          </Button>
        </div>

        {/* Right - Calendly placeholder / secondary CTA */}
        <div className="bg-navy-light rounded-2xl border border-white/10 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-[family-name:var(--font-heading)] text-white mb-2">
            20 minutes. Your roles. Your market.
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            Tell us what you&apos;re hiring for and we&apos;ll share the data that&apos;s most relevant — compensation benchmarks, candidate supply, and what we&apos;re seeing in real time.
          </p>
          <Button size="lg" href={CALENDLY_URL}>
            Book a Call
          </Button>
          <p className="text-xs text-gray-500 mt-4">
            No pitch. Just data.
          </p>
        </div>
      </div>
    </SectionWrapper>
  );
}
