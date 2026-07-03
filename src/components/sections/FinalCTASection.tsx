'use client';

import { CheckCircle, Calendar, Bell } from 'lucide-react';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { Button } from '@/components/ui/Button';
import { useBenchmark } from '@/hooks/useBenchmark';
import { useGate } from '@/hooks/useGate';
import { SECTION_IDS, BOOK_CALL_URL } from '@/lib/constants';

export function FinalCTASection() {
  const { roleName, profile } = useBenchmark();
  const { showModal, isUnlocked } = useGate();
  const subscribed = isUnlocked;

  const valueProps = [
    `The full ${roleName.toLowerCase()} dataset — every cut we publish, and the ones we don't`,
    'A read tailored to your team, your reqs, and your market',
    'Which employers are competing for the same people (we name them on the call)',
    'What we’re seeing in real time from placements and conversations',
  ];

  return (
    <SectionWrapper id={SECTION_IDS.cta} dark className="py-16 md:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-heading)] text-white mb-4">
            The summary is free. The full picture is a conversation.
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Everything on this page is the open layer. The tailored layer — your roles, your market, named
            competition, candidate supply — is 20 minutes with the person who actually works this market.
            Not a hand-off.
          </p>
          <ul className="space-y-4 mb-8">
            {valueProps.map((prop) => (
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
            <Bell className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-[family-name:var(--font-heading)] text-white mb-2">
            Track the {roleName} benchmark
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            We&apos;ll email you when your role&apos;s number moves — new survey data, market shifts, fresh
            cuts. A few times a year, never noise.
          </p>
          {subscribed ? (
            <p className="text-primary font-semibold text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> You&apos;re on the list — we&apos;ll ping you when it moves.
            </p>
          ) : (
            <Button size="lg" variant="secondary" onClick={showModal}>
              Get benchmark alerts
            </Button>
          )}
          <p className="text-xs text-gray-500 mt-4">Unlocks the detailed breakdowns on this page, too.</p>
        </div>
      </div>
    </SectionWrapper>
  );
}
