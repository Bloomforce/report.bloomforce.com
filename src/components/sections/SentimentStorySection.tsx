'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { ScrollyStage } from '@/components/scrolly/ScrollyStage';
import { DotSwarm, type SwarmDot, type SwarmLayout } from '@/components/scrolly/DotSwarm';
import { SectionCTABand } from '@/components/sections/SectionCTABand';
import { useBenchmark } from '@/hooks/useBenchmark';
import { useGate } from '@/hooks/useGate';
import { SECTION_IDS } from '@/lib/constants';
import type { SentimentCut } from '@/lib/insights/types';

const TEAL = '#3BC3B4';
const TEAL_DEEP = '#00A896';
const AMBER = '#E8A13A';
const ROSE = '#E0586B';
const SLATE = '#7A8BA6';

/** Deterministic quasi-random in [0,1) per (index, dimension) — stable across renders/SSR. */
function hash01(i: number, dim: number): number {
  const x = Math.sin(i * 127.1 + dim * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function assign(i: number, dim: number, options: { key: string; share: number }[]): string {
  const r = hash01(i, dim);
  let acc = 0;
  for (const o of options) {
    acc += o.share;
    if (r < acc) return o.key;
  }
  return options[options.length - 1]?.key ?? '';
}

function metricCut(sentiment: SentimentCut[], key: string, year = 2025, family = 'all'): SentimentCut | null {
  return (
    sentiment.find(
      (s) => s.metricKey === key && s.surveyYear === year && (family === 'all' ? !s.cohort.roleFamily : s.cohort.roleFamily === family) && s.id.endsWith('|all'),
    ) ??
    sentiment.find((s) => s.metricKey === key && s.surveyYear === year && (family === 'all' ? !s.cohort.roleFamily : s.cohort.roleFamily === family)) ??
    null
  );
}

function pct(cut: SentimentCut | null, option: string): number {
  return cut?.values.find((v) => v.key === option)?.value ?? 0;
}

function deltaPts(cut: SentimentCut | null, option: string): number | null {
  const d = cut?.values.find((v) => v.key === option)?.deltaYoY;
  return d === null || d === undefined ? null : Math.round(d * 100);
}

/** Cluster grid placement: lay a category's dots in a block around a center. */
function clusterPlace(indexInGroup: number, groupSize: number, cx: number, cy: number, width: number) {
  const cols = Math.max(3, Math.ceil(Math.sqrt(groupSize * 1.6)));
  const row = Math.floor(indexInGroup / cols);
  const col = indexInGroup % cols;
  const rows = Math.ceil(groupSize / cols);
  return {
    x: cx + ((col - cols / 2) / cols) * width,
    y: cy + ((row - rows / 2) / rows) * 0.42,
  };
}

const N_DOTS = 420;

export function SentimentStorySection() {
  const { data, profile, roleName } = useBenchmark();
  const { showModal } = useGate();
  const sentiment = data.sentiment;

  const wlb = metricCut(sentiment, 'satisfaction_wlb');
  const wm = metricCut(sentiment, 'remote_share');
  const rto = metricCut(sentiment, 'rto_response');
  const rif = metricCut(sentiment, 'layoffs');
  const ma = metricCut(sentiment, 'ma_activity');
  const myWlb = metricCut(sentiment, 'satisfaction_wlb', 2025, profile.roleKey);

  const totalN = data.freshness.totalRespondents;

  // Synthetic dots matching the published marginal distributions.
  const dots: SwarmDot[] = useMemo(() => {
    const familyShares = data.demand.length
      ? data.demand.map((d) => ({ key: d.key, share: d.share }))
      : [{ key: profile.roleKey, share: 1 }];
    const norm = familyShares.reduce((s, f) => s + f.share, 0) || 1;
    const fams = familyShares.map((f) => ({ key: f.key, share: f.share / norm }));
    const dist = (cut: SentimentCut | null, fallback: { key: string; share: number }[]) =>
      cut ? cut.values.map((v) => ({ key: v.key, share: v.value })) : fallback;

    return Array.from({ length: N_DOTS }, (_, i) => ({
      tags: {
        wlb: assign(i, 1, dist(wlb, [{ key: 'satisfied', share: 0.84 }, { key: 'dissatisfied', share: 0.16 }])),
        wm: assign(i, 2, dist(wm, [{ key: 'remote', share: 0.64 }, { key: 'hybrid', share: 0.27 }, { key: 'onsite', share: 0.09 }])),
        rto: assign(i, 3, dist(rto, [{ key: 'look', share: 0.5 }, { key: 'negotiate', share: 0.41 }, { key: 'comply', share: 0.09 }])),
        rif: assign(i, 4, dist(rif, [{ key: 'yes', share: 0.34 }, { key: 'no', share: 0.66 }])),
        family: assign(i, 5, fams),
      },
    }));
  }, [data.demand, wlb, wm, rto, rif, profile.roleKey]);

  const layouts: { layout: SwarmLayout; kicker: string; caption: React.ReactNode }[] = useMemo(() => {
    const groupIndex = (tag: string, values: string[]) => {
      const counters: Record<string, number> = {};
      const idx: number[] = [];
      const groupOf: string[] = [];
      dots.forEach((d) => {
        const v = d.tags[tag];
        counters[v] = (counters[v] ?? 0) + 1;
        idx.push(counters[v] - 1);
        groupOf.push(v);
      });
      const sizes = Object.fromEntries(values.map((v) => [v, dots.filter((d) => d.tags[tag] === v).length]));
      return { idx, groupOf, sizes };
    };

    const wlbG = groupIndex('wlb', ['satisfied', 'somewhat', 'dissatisfied']);
    const wmG = groupIndex('wm', ['remote', 'hybrid', 'onsite']);
    const rtoG = groupIndex('rto', ['look', 'negotiate', 'comply']);
    const rifG = groupIndex('rif', ['yes', 'no']);

    const columns = (
      g: { idx: number[]; groupOf: string[]; sizes: Record<string, number> },
      centers: Record<string, { x: number; color: string }>,
    ): SwarmLayout => ({
      place: (_d, i) => {
        const grp = g.groupOf[i];
        const c = centers[grp] ?? { x: 0.5, color: SLATE };
        const p = clusterPlace(g.idx[i], g.sizes[grp] ?? 1, c.x, 0.5, 0.26);
        return { x: p.x, y: p.y, color: c.color, alpha: 1 };
      },
    });

    return [
      {
        kicker: 'The workforce',
        caption: (
          <>
            <span className="text-white font-semibold">{totalN.toLocaleString()} EHR professionals</span> told us
            what they earn and how work actually feels — across two survey waves. Each dot is roughly{' '}
            {Math.max(1, Math.round(totalN / N_DOTS))} of them.
          </>
        ),
        layout: {
          place: (_d, i) => {
            const cols = 28;
            const row = Math.floor(i / cols);
            return {
              x: 0.12 + ((i % cols) / cols) * 0.76 + hash01(i, 8) * 0.015,
              y: 0.18 + (row / Math.ceil(N_DOTS / cols)) * 0.64 + hash01(i, 9) * 0.015,
              color: TEAL,
              alpha: 0.9,
            };
          },
        },
      },
      {
        kicker: 'Work-life balance',
        caption: (
          <>
            <span className="text-white font-semibold">{Math.round(pct(wlb, 'satisfied') * 100)}% are satisfied
            with their work-life balance</span>
            {deltaPts(wlb, 'satisfied') !== null && (
              <> — {deltaPts(wlb, 'satisfied')! >= 0 ? 'up' : 'down'} {Math.abs(deltaPts(wlb, 'satisfied')!)} points
              from the previous wave</>
            )}
            . Remote flexibility is doing a lot of that work.
          </>
        ),
        layout: columns(wlbG, {
          satisfied: { x: 0.3, color: TEAL },
          somewhat: { x: 0.62, color: AMBER },
          dissatisfied: { x: 0.82, color: ROSE },
        }),
      },
      {
        kicker: 'Where work happens',
        caption: (
          <>
            <span className="text-white font-semibold">{Math.round(pct(wm, 'remote') * 100)}% are fully remote</span>
            , {Math.round(pct(wm, 'hybrid') * 100)}% hybrid, {Math.round(pct(wm, 'onsite') * 100)}% in the office.
            Remote isn&apos;t a perk in this market — it&apos;s the baseline.
          </>
        ),
        layout: columns(wmG, {
          remote: { x: 0.28, color: TEAL },
          hybrid: { x: 0.6, color: TEAL_DEEP },
          onsite: { x: 0.83, color: SLATE },
        }),
      },
      {
        kicker: 'The RTO test',
        caption: (
          <>
            Force a return to the office, and{' '}
            <span className="text-white font-semibold">
              {Math.round((pct(rto, 'look') + pct(rto, 'negotiate')) * 100)}% would push back
            </span>{' '}
            — {Math.round(pct(rto, 'look') * 100)}% would start looking, {Math.round(pct(rto, 'negotiate') * 100)}%
            would negotiate. Only {Math.round(pct(rto, 'comply') * 100)}% would simply comply.
          </>
        ),
        layout: columns(rtoG, {
          look: { x: 0.26, color: ROSE },
          negotiate: { x: 0.58, color: AMBER },
          comply: { x: 0.84, color: TEAL },
        }),
      },
      {
        kicker: 'Consolidation',
        caption: (
          <>
            The ground is moving underneath them:{' '}
            <span className="text-white font-semibold">{Math.round(pct(ma, 'yes') * 100)}% went through M&A</span>{' '}
            in the last three years, and{' '}
            <span className="text-white font-semibold">{Math.round(pct(rif, 'yes') * 100)}% watched their org run
            a layoff</span>{' '}
            in the last year{deltaPts(rif, 'yes') !== null && deltaPts(rif, 'yes')! > 0 && <> — up {deltaPts(rif, 'yes')} points year over year</>}.
          </>
        ),
        layout: columns(rifG, {
          yes: { x: 0.33, color: ROSE },
          no: { x: 0.7, color: TEAL },
        }),
      },
      {
        kicker: 'People like you',
        caption: (
          <>
            Among <span className="text-white font-semibold">{roleName}s</span>
            {myWlb ? (
              <>
                , <span className="text-white font-semibold">{Math.round(pct(myWlb, 'satisfied') * 100)}% are satisfied
                with work-life balance</span> (n={myWlb.n})
              </>
            ) : (
              <> the cohort cut is still collecting</>
            )}
            . This is your peer group — the same people behind your benchmark above.
          </>
        ),
        layout: {
          place: (d, i) => {
            const mine = d.tags.family === profile.roleKey;
            const cols = 28;
            const row = Math.floor(i / cols);
            return {
              x: 0.12 + ((i % cols) / cols) * 0.76 + hash01(i, 8) * 0.015,
              y: 0.18 + (row / Math.ceil(N_DOTS / cols)) * 0.64 + hash01(i, 9) * 0.015,
              color: mine ? TEAL : SLATE,
              alpha: mine ? 1 : 0.14,
              r: mine ? 3.6 : 3,
            };
          },
        },
      },
    ];
  }, [dots, wlb, wm, rto, rif, ma, myWlb, roleName, profile.roleKey, totalN]);

  const mobileFallback = (
    <div className="flex flex-col gap-4">
      {layouts.map((l, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-navy-light rounded-2xl border border-white/10 p-5"
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary-light mb-2">{l.kicker}</div>
          <p className="text-[15px] text-gray-300 leading-relaxed">{l.caption}</p>
        </motion.div>
      ))}
    </div>
  );

  return (
    <SectionWrapper id={SECTION_IDS.sentimentStory} dark className="!py-16">
      <div className="text-center mb-8">
        <Badge className="mb-4">Workforce insights</Badge>
        <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-heading)] text-white mb-3">
          The workforce, in motion
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto">Scroll — each dot is a real group of professionals from the survey.</p>
      </div>

      <ScrollyStage
        steps={layouts.length}
        mobileFallback={mobileFallback}
      >
        {(step) => (
          <div className="relative h-full">
            <DotSwarm dots={dots} layout={layouts[step].layout} className="absolute inset-0" />
            <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-xl bg-navy-light/95 backdrop-blur rounded-2xl border border-white/10 px-6 py-5 text-center"
                >
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary-light mb-1.5">
                    {layouts[step].kicker}
                  </div>
                  <p className="text-[15px] text-gray-300 leading-relaxed">{layouts[step].caption}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            {/* step dots */}
            <div className="absolute top-2 right-2 flex flex-col gap-1.5">
              {layouts.map((_, i) => (
                <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === step ? 'bg-primary-light' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>
        )}
      </ScrollyStage>

      <SectionCTABand
        className="border-l-primary bg-navy-light !border-white/10 [&_p]:!text-white [&_.text-navy]:!text-white"
        title={`Track how ${roleName}s are feeling`}
        subtitle="Get the alert when your role's sentiment or benchmark moves — a few times a year, never noise."
        buttonLabel="Get benchmark alerts"
        onClick={showModal}
      />
    </SectionWrapper>
  );
}
