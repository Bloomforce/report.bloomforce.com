'use client';

import { CheckCircle, Calendar } from 'lucide-react';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { Button } from '@/components/ui/Button';
import { SECTION_IDS, CALENDLY_URL } from '@/lib/constants';

const valueProps = [
  '100% Healthcare IT Focused — Epic, EHR, and beyond',
  'Pre-vetted professionals from our curated network',
  'Flexible: contract, contract-to-hire, or permanent',
  'Deep salary and market intelligence to inform your hiring',
];

export function CTASection() {
  return (
    <SectionWrapper id={SECTION_IDS.cta} dark className="py-16 md:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left - value prop */}
        <div>
          <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-heading)] text-white mb-4">
            Build your healthcare IT team with Bloomforce
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Whether you need Epic analysts, AI engineers, or IT leadership — we connect health systems with the specialized talent they need.
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
            Schedule a Call
          </Button>
        </div>

        {/* Right - Calendly placeholder / secondary CTA */}
        <div className="bg-navy-light rounded-2xl border border-white/10 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-[family-name:var(--font-heading)] text-white mb-2">
            Let&apos;s talk about your hiring needs
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            Book a 15-minute call with our team. We&apos;ll share market insights tailored to your open roles and help you find the right talent.
          </p>
          <Button size="lg" href={CALENDLY_URL}>
            Book a Meeting
          </Button>
          <p className="text-xs text-gray-500 mt-4">
            Free consultation. No commitment required.
          </p>
        </div>
      </div>
    </SectionWrapper>
  );
}
