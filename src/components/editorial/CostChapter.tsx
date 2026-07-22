'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { EditorialChapter, type EditorialStoryStep } from './EditorialChapter';
import { useBenchmark } from '@/hooks/useBenchmark';
import { useGate } from '@/hooks/useGate';
import { formatK } from '@/lib/insights/format';
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
    title: 'Start with the full Application Analyst salary range.',
    body: 'The median provides a useful reference. The middle half shows where most qualified Application Analyst offers are competing, while the broader range captures meaningful differences in experience and scope.',
    evidence: 'Every compensation figure in this chapter reflects the national Application Analyst benchmark.',
  },
  {
    label: 'The experience premium',
    title: 'Application Analyst pay rises sharply with experience.',
    body: 'Senior and lead-level analysts command a meaningful premium as specialized knowledge, independent delivery, and ownership of complex application work increase.',
    evidence: 'Each rung is a national Application Analyst benchmark from the ongoing survey.',
  },
  {
    label: 'Location as compensation',
    title: 'Work model changes who you compete with.',
    body: 'Remote roles enter a national market. Hybrid and on-site roles trade some reach for local availability, making flexibility part of the compensation decision.',
  },
  {
    label: 'The employer effect',
    title: 'Employer type can change the competitive range.',
    body: 'Academic medical centers, children\'s hospitals, community health systems, and consulting firms often pay differently for similar Application Analyst work. The right peer group helps leaders set a range candidates will take seriously.',
    evidence: 'The detailed employer comparison is available with report access.',
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
      return (
        <figure aria-label="Compensation and workforce share by work model">
          <figcaption className={styles.figureTitle}>Work model changes the market</figcaption>
          {renderBars(workModels.map((item) => ({
            label: WORK_MODEL_LABELS[item.workModel] ?? item.workModel,
            value: item.median ?? 0,
            note: `${Math.round(item.share * 100)}% of workforce`,
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
      eyebrow="What talent costs now"
      title="A practical compensation view for Epic Application Analysts."
      intro="This chapter uses Application Analyst as its reference role, showing how experience, flexibility, and employer type shape the salary range."
      steps={STEPS}
      renderVisual={(step) => renderVisual(step)}
    />
  );
}
