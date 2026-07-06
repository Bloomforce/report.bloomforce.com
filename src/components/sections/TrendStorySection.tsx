'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Brain, Users, Compass } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { ScrollyStage } from '@/components/scrolly/ScrollyStage';
import { SectionCTABand } from '@/components/sections/SectionCTABand';
import { useBenchmark } from '@/hooks/useBenchmark';
import { SECTION_IDS } from '@/lib/constants';
import type { SentimentCut } from '@/lib/insights/types';

function cut(sentiment: SentimentCut[], key: string): SentimentCut | null {
  return (
    sentiment.find(
      (s) => s.metricKey === key && s.surveyYear === 2025 && !s.cohort.roleFamily && !s.cohort.workModel,
    ) ?? null
  );
}

interface Frame {
  icon: typeof Brain;
  kicker: string;
  headlineValue: string;
  headlineLabel: string;
  bars: { label: string; value: number }[];
  note: string;
  n: number;
}

function FrameView({ frame }: { frame: Frame }) {
  const Icon = frame.icon;
  return (
    <div className="bg-white rounded-2xl border border-ink/10 shadow-sm shadow-ink/[0.03] p-8 md:p-10 max-w-3xl mx-auto">
      <div className="flex items-center gap-2.5 mb-5">
        <Icon className="w-5 h-5 text-primary" />
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">{frame.kicker}</span>
        <span className="ml-auto text-[11px] text-text-light font-[family-name:var(--font-mono)]">{frame.n} reports</span>
      </div>
      <div className="flex items-baseline gap-3 mb-1">
        <span className="text-5xl md:text-6xl font-bold text-navy font-[family-name:var(--font-mono)] tabular-nums tracking-tight">
          {frame.headlineValue}
        </span>
      </div>
      <p className="text-text-muted mb-7">{frame.headlineLabel}</p>
      <div className="flex flex-col gap-3 mb-6">
        {frame.bars.map((b) => (
          <div key={b.label} className="grid grid-cols-[170px_1fr_52px] items-center gap-3 text-sm">
            <span className="text-navy truncate">{b.label}</span>
            <span className="h-5 bg-bg-subtle rounded-md overflow-hidden">
              <motion.span
                className="block h-full rounded-md bg-gradient-to-r from-primary to-primary-light"
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.round(b.value * 100)}%` }}
                viewport={{ once: false }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            </span>
            <span className="text-right font-semibold text-navy font-[family-name:var(--font-mono)] tabular-nums">
              {Math.round(b.value * 100)}%
            </span>
          </div>
        ))}
      </div>
      <p className="text-sm text-text-muted border-t border-ink/5 pt-4">{frame.note}</p>
    </div>
  );
}

export function TrendStorySection() {
  const { data } = useBenchmark();

  const frames: Frame[] = useMemo(() => {
    const ai = cut(data.sentiment, 'ai_impact');
    const aiOrg = cut(data.sentiment, 'ai_org');
    const seeking = cut(data.sentiment, 'job_seeking');
    const fair = cut(data.sentiment, 'fair_comp');

    const v = (c: SentimentCut | null, k: string) => c?.values.find((x) => x.key === k)?.value ?? 0;

    return [
      {
        icon: Brain,
        kicker: 'AI, on the ground',
        headlineValue: `${Math.round((v(ai, 'no_impact') + v(ai, 'enhance')) * 100)}%`,
        headlineLabel: 'expect AI to leave their role intact, or make it better',
        bars: ai?.values.map((x) => ({ label: x.label, value: x.value })) ?? [],
        note: 'The people who run the EHR aren’t bracing for replacement. They expect AI to absorb the busywork first. The tell: watch which orgs staff for it (next).',
        n: ai?.n ?? 0,
      },
      {
        icon: Users,
        kicker: 'AI, in the org chart',
        headlineValue: `${Math.round(v(aiOrg, 'have') * 100)}%`,
        headlineLabel: 'of organizations already have people dedicated to AI',
        bars: aiOrg?.values.map((x) => ({ label: x.label, value: x.value })) ?? [],
        note: 'Adoption is running ahead of staffing. Most orgs are deploying AI features faster than they’re hiring for them. That gap is where new roles (and premiums) come from.',
        n: aiOrg?.n ?? 0,
      },
      {
        icon: Compass,
        kicker: 'The market’s posture',
        headlineValue: `${Math.round((v(seeking, 'passive') + v(seeking, 'planning') + v(seeking, 'active')) * 100)}%`,
        headlineLabel: 'are open to a move, most of them quietly',
        bars: seeking?.values.map((x) => ({ label: x.label, value: x.value })) ?? [],
        note: fair
          ? `And compensation is the pressure point: ${Math.round(v(fair, 'no') * 100)}% don’t feel fairly paid. A market that looks stable on paper is one good offer away from moving.`
          : 'A market that looks stable on paper is one good offer away from moving.',
        n: seeking?.n ?? 0,
      },
    ];
  }, [data.sentiment]);

  const mobileFallback = (
    <div className="flex flex-col gap-4">
      {frames.map((f) => (
        <FrameView key={f.kicker} frame={f} />
      ))}
    </div>
  );

  return (
    <SectionWrapper id={SECTION_IDS.trends}>
      <div className="text-center mb-8">
        <Badge className="mb-4">The evolving landscape</Badge>
        <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-heading)] text-navy mb-3">
          What&apos;s actually changing
        </h2>
        <p className="text-text-muted max-w-2xl mx-auto">
          Not the hype cycle. Just what {data.freshness.totalRespondents.toLocaleString()} professionals report
          from inside the industry.
        </p>
      </div>

      <ScrollyStage steps={frames.length} vhPerStep={70} mobileFallback={mobileFallback}>
        {(step) => (
          <div className="h-full flex items-center">
            <div className="w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <FrameView frame={frames[step]} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </ScrollyStage>

      <SectionCTABand
        title="Want this read against your org?"
        subtitle="A 20-minute data review: your roles, your market, what's coming."
        buttonLabel="Book a data review"
        href={`#${SECTION_IDS.cta}`}
      />
    </SectionWrapper>
  );
}
