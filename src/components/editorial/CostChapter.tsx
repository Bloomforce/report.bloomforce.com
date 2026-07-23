'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { EditorialChapter, type EditorialStoryStep } from './EditorialChapter';
import { useBenchmark } from '@/hooks/useBenchmark';
import { useGate } from '@/hooks/useGate';
import { apportionWholePercentages, formatK } from '@/lib/insights/format';
import { EMPLOYER_TYPE_LABELS, WORK_MODEL_LABELS } from '@/lib/insights/employer-types';
import type { BenchmarkRow, Seniority } from '@/lib/insights/types';
import styles from './editorial.module.css';

const LEVEL_LABELS: Partial<Record<Seniority, string>> = {
  L1: 'Early',
  L2: 'Mid',
  L3: 'Senior',
  L4: 'Lead',
  M1: 'Manager',
};

const STEPS: EditorialStoryStep[] = [
  {
    label: 'Application Analyst pay',
    title: 'Start with the full salary distribution, not one average.',
    body: 'The median is the midpoint of the market, but it does not describe every competitive offer. The middle 50% shows where most qualified candidates are paid, while the wider range reflects real differences in experience, responsibility, and specialization.',
    evidence: 'All compensation figures in this chapter use the national Application Analyst benchmark.',
  },
  {
    label: 'The experience premium',
    title: 'Experience changes the salary a role can command.',
    body: 'Senior and lead analysts are paid more because they can work independently, own complex applications, and solve problems that require deeper technical and operational knowledge.',
    evidence: 'Each level is a national Application Analyst benchmark from the ongoing salary survey.',
  },
  {
    label: 'The work model',
    title: 'Remote work expands the market you compete in.',
    body: 'A remote role competes for talent nationally. Hybrid and on-site roles draw from a smaller geographic pool, so the required work model directly affects candidate reach and salary expectations.',
  },
  {
    label: 'The peer group',
    title: 'Compare your range with similar employers.',
    body: 'Academic medical centers, children\'s hospitals, community health systems, and consulting firms may pay differently for similar work. Comparing the role with the right type of organization produces a more realistic hiring range.',
    evidence: 'The detailed comparison by organization type is available with report access.',
  },
];

function nationalLevelRows(rows: BenchmarkRow[]): BenchmarkRow[] {
  return rows
    .filter(
      (row) =>
        row.region === 'National' &&
        row.workModel === 'all' &&
        row.employerType === 'all' &&
        row.seniority !== 'ALL' &&
        row.seniority in LEVEL_LABELS,
    )
    .filter((row, index, all) => all.findIndex((item) => item.seniority === row.seniority) === index)
    .sort((a, b) => a.blended.p50 - b.blended.p50);
}

export function CostChapter() {
  const { data, row, familyRows, roleName, guardedRole } = useBenchmark();
  const { isUnlocked, showModal } = useGate();
  const reducedMotion = useReducedMotion();
  const levels = nationalLevelRows(familyRows);
  const employerCuts = familyRows
    .filter((item) => item.employerType !== 'all' && item.region === 'National' && item.seniority === 'ALL' && item.workModel === 'all')
    .sort((a, b) => b.blended.p50 - a.blended.p50)
    .slice(0, 5);

  function renderBars(items: { label: string; value: number; note?: string }[], valueLabel = formatK) {
    const max = Math.max(...items.map((item) => item.value), 1);
    return (
      <div className={styles.rankedBars}>
        {items.map((item, index) => (
          <div key={item.label} className={styles.rankedRow}>
            <div className={styles.rankedLabel}><span>{item.label}</span>{item.note && <small>{item.note}</small>}</div>
            <div className={styles.rankedTrack}>
              <motion.span
                initial={reducedMotion ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: reducedMotion ? 0 : 0.65, delay: reducedMotion ? 0 : index * 0.06 }}
                style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }}
              />
            </div>
            <strong>{valueLabel(item.value)}</strong>
          </div>
        ))}
      </div>
    );
  }

  function renderVisual(step: number) {
    if (guardedRole) {
      return (
        <div className={styles.lockedVisual}>
          <Lock aria-hidden="true" />
          <p className={styles.visualKicker}>Leadership data</p>
          <h3>Private by design.</h3>
          <p>Leadership compensation and market cuts are shared in a tailored review.</p>
        </div>
      );
    }

    if (step === 0 && row) {
      const range = row.blended.p90 - row.blended.p10 || 1;
      const left = ((row.blended.p25 - row.blended.p10) / range) * 100;
      const width = ((row.blended.p75 - row.blended.p25) / range) * 100;
      const median = ((row.blended.p50 - row.blended.p10) / range) * 100;
      return (
        <figure className={styles.costRange} aria-label={`${roleName} compensation distribution`}>
          <figcaption><span>{roleName}</span><small>{row.n} reports · {row.confidenceTier}</small></figcaption>
          <p className={styles.visualKicker}>Published market range</p>
          <strong className={styles.heroMetric}>{formatK(row.blended.p50)}</strong>
          <span className={styles.metricCaption}>market median</span>
          <div className={styles.distributionRail}>
            <span className={styles.distributionBand} style={{ left: `${left}%`, width: `${width}%` }} />
            <span className={styles.distributionMedian} style={{ left: `${median}%` }} />
          </div>
          <div className={styles.distributionLabels}>
            <span><small>10th</small>{formatK(row.blended.p10)}</span>
            <span><small>25th</small>{formatK(row.blended.p25)}</span>
            <span><small>Median</small>{formatK(row.blended.p50)}</span>
            <span><small>75th</small>{formatK(row.blended.p75)}</span>
            <span><small>90th</small>{formatK(row.blended.p90)}</span>
          </div>
        </figure>
      );
    }

    if (step === 1) {
      return (
        <figure aria-label={`${roleName} compensation by experience level`}>
          <figcaption className={styles.figureTitle}>Application Analyst median compensation by level</figcaption>
          {levels.length > 1 ? renderBars(levels.map((item) => ({
            label: LEVEL_LABELS[item.seniority as Seniority] ?? item.seniority,
            value: item.blended.p50,
            note: `${item.n} reports`,
          }))) : <p className={styles.noData}>This role is still collecting enough level-specific data to publish.</p>}
        </figure>
      );
    }

    if (step === 2) {
      const workModels = data.workModels.filter((item) => item.median !== null);
      const workModelPercents = apportionWholePercentages(workModels.map((item) => item.share));
      return (
        <figure aria-label="Compensation and workforce share by work model">
          <figcaption className={styles.figureTitle}>Work model changes the market</figcaption>
          {renderBars(workModels.map((item, index) => ({
            label: WORK_MODEL_LABELS[item.workModel] ?? item.workModel,
            value: item.median ?? 0,
            note: `${workModelPercents[index]}% of workforce`,
          })))}
          <p className={styles.visualFootnote}>National median compensation · all published roles</p>
        </figure>
      );
    }

    const employerVisual = (
      <figure aria-label={`${roleName} compensation by organization type`}>
        <figcaption className={styles.figureTitle}>Median by organization type</figcaption>
        {employerCuts.length > 1 ? renderBars(employerCuts.map((item) => ({
          label: EMPLOYER_TYPE_LABELS[item.employerType] ?? item.employerType,
          value: item.blended.p50,
          note: `${item.n} reports`,
        }))) : <p className={styles.noData}>More organization-type data is needed for this role.</p>}
      </figure>
    );

    return isUnlocked ? employerVisual : (
      <div className={styles.editorialGate}>
        <div aria-hidden="true" className={styles.gatePreview}>{employerVisual}</div>
        <div className={styles.gateOverlay}>
          <Lock aria-hidden="true" />
          <h3>See how Application Analyst pay changes by employer type.</h3>
          <p>Compare academic medical centers, children&apos;s hospitals, community systems, and other employers.</p>
          <button type="button" onClick={showModal}>Request access</button>
        </div>
      </div>
    );
  }

  return (
    <EditorialChapter
      id="briefing-cost"
      number="01"
      eyebrow="Compensation"
      title="What health systems should expect to pay Epic Application Analysts."
      intro="We begin with Application Analysts because they represent a large share of Epic hiring. Their market shows how experience, work model, and organization type change a competitive salary range."
      steps={STEPS}
      renderVisual={(step) => renderVisual(step)}
    />
  );
}
