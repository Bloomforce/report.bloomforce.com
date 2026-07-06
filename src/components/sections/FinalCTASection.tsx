'use client';

import { CheckCircle, Calendar, ClipboardList } from 'lucide-react';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { Button } from '@/components/ui/Button';
import { useBenchmark } from '@/hooks/useBenchmark';
import { SECTION_IDS, BOOK_CALL_URL, SURVEY_URL } from '@/lib/constants';

const VALUE_PROPS = [
  'The full dataset, including cuts not published on this page',
  'Director, VP, and C-suite numbers, by market and org type',
  'A read tailored to your team, your roles, and your market',
  'Which employers are competing for the same people. We name them on the call.',
];

export function FinalCTASection() {
  const { profile } = useBenchmark();

  return (
    <SectionWrapper id={SECTION_IDS.cta} dark className="py-16 md:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-heading)] text-white mb-4">
            The summary is free. The full picture is a conversation.
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Everything on this page is the open layer. The tailored layer is 20 minutes with the person who
            actually works this market. Not a hand-off.
          </p>
          <ul className="space-y-4 mb-8">
            {VALUE_PROPS.map((prop) => (
              <li key={prop} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-gray-300">{prop}</span>
              </li>
            ))}
          </ul>
          <Button size="lg" href={`${BOOK_CALL_URL}?utm_source=insights&utm_content=${profile.roleKey}`}>
            <Calendar className="w-4 h-4 mr-2" />
            Book a 20-min data review
          </Button>
          <p className="text-xs text-gray-500 mt-3">No pitch. Just data.</p>
        </div>

        <div className="bg-navy-light rounded-2xl border border-white/10 p-8">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <ClipboardList className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-[family-name:var(--font-heading)] text-white mb-2">
            Be counted in the next refresh
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            The 2026 survey is collecting now. Five to seven minutes, fully anonymous, and your answers shape
            the numbers on this page.
          </p>
          <Button size="lg" variant="secondary" href={SURVEY_URL}>
            Take the 2026 survey
          </Button>
          <p className="text-xs text-gray-500 mt-4">Every number here started with someone taking it.</p>
        </div>
      </div>
    </SectionWrapper>
  );
}
