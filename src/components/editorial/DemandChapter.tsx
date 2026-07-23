'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronDown, Lock } from 'lucide-react';
import { ContributionGate } from '@/components/gate/ContributionGate';
import { EditorialChapter, type EditorialStoryStep } from './EditorialChapter';
import { useBenchmark } from '@/hooks/useBenchmark';
import { useGate } from '@/hooks/useGate';
import type { DemandCell } from '@/lib/insights/types';
import styles from './editorial.module.css';

function points(value: number | null) {
  if (value === null) return 'Collecting';
  const absolutePoints = Math.abs(value * 100);
  if (absolutePoints > 0 && absolutePoints < 0.1) {
    return `${value > 0 ? '+' : '-'}<0.1 pts`;
  }
  const rounded = Math.round(value * 1000) / 10;
  const normalized = Object.is(rounded, -0) ? 0 : rounded;
  const formatted = Number.isInteger(normalized) ? normalized.toFixed(0) : normalized.toFixed(1);
  return `${normalized > 0 ? '+' : ''}${formatted} pts`;
}

export function DemandChapter() {
  const { data } = useBenchmark();
  const { isContributor } = useGate();
  const [gateOpen, setGateOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const functionalMovement = [...data.demand]
    .filter((item) => item.key !== 'AA' && item.delta30d !== null)
    .sort((a, b) => (b.delta30d ?? 0) - (a.delta30d ?? 0));
  const moduleMovement = [...data.moduleDemand]
    .filter((item) => item.delta30d !== null)
    .sort((a, b) => (b.delta30d ?? 0) - (a.delta30d ?? 0));
  const managerDemand = data.demand.find((item) => item.key === 'MGR');
  const hottestFunction = functionalMovement[0];
  const hottestModule = moduleMovement[0];
  const nextModules = moduleMovement.slice(1, 3).map((item) => item.label).join(' and ');
  const managerShare = Math.round((managerDemand?.share ?? 0) * 100);
  const managerOpenings = Math.round((managerDemand?.share ?? 0) * data.freshness.postingsIngested);

  function openDemandAccess() {
    setGateOpen(true);
    window.setTimeout(() => {
      document.getElementById('briefing-demand-access')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  const steps: EditorialStoryStep[] = [
    {
      label: 'Thirty-day functional movement',
      title: `${hottestFunction?.label ?? 'Specialized Epic demand'} increased the most among the functions we track.`,
      body: 'The 30-day comparison shows which types of EHR work are taking a larger share of current job postings. A rising share is an early sign that more employers may soon be competing for the same talent.',
      evidence: hottestFunction
        ? `${hottestFunction.label} changed ${points(hottestFunction.delta30d)} in the latest 30-day comparison.`
        : 'Functional movement will publish when the next market comparison clears review.',
    },
    {
      label: 'The manager bottleneck',
      title: 'Epic Application Managers require two different kinds of experience.',
      body: 'The strongest candidates need enough Epic depth to understand the work and enough leadership experience to coach, delegate, set priorities, and hold a team accountable. That combination makes the qualified pool smaller than the analyst pool.',
      evidence: `${managerDemand?.label ?? 'IT Manager'} roles account for ${managerShare}% of demand in the current market sample.`,
    },
    {
      label: 'Inside Application Analyst demand',
      title: `${hottestModule?.label ?? 'Willow'} demand increased the fastest among the Epic applications we track.`,
      body: `${hottestModule?.label ?? 'Willow'} changed ${points(hottestModule?.delta30d ?? null)} within Application Analyst postings${nextModules ? `, followed by ${nextModules}` : ''}. This module-level view shows where competition is increasing, holding steady, or declining.`,
      evidence: 'Share one anonymous salary data point to unlock the full application-level movement view.',
    },
  ];

  function movementBars(items: DemandCell[]) {
    const max = Math.max(...items.map((item) => Math.abs(item.delta30d ?? 0)), 0.01);
    return (
      <div className={styles.demandBars}>
        {items.map((item, index) => {
          const value = item.delta30d ?? 0;
          return (
            <div key={`${item.dimension}-${item.key}`} className={styles.demandRow}>
              <span>{item.label}</span>
              <div>
                <motion.i
                  className={value < 0 ? styles.demandDown : undefined}
                  initial={reducedMotion ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: reducedMotion ? 0 : 0.55, delay: reducedMotion ? 0 : index * 0.045 }}
                  style={{ width: `${Math.max(4, (Math.abs(value) / max) * 100)}%` }}
                />
              </div>
              <strong className={value < 0 ? styles.negative : styles.positive}>{points(value)}</strong>
            </div>
          );
        })}
      </div>
    );
  }

  function renderVisual(step: number) {
    if (step === 0) {
      return (
        <figure aria-label="Thirty-day movement across specialized EHR functions">
          <figcaption className={styles.figureTitle}>Specialized function movement · 30 days</figcaption>
          {functionalMovement.length
            ? movementBars(functionalMovement.slice(0, 7))
            : <p className={styles.noData}>The next functional movement refresh is still processing.</p>}
          <div className={styles.movementLegend}><span>Growing</span><span>Cooling</span></div>
        </figure>
      );
    }

    if (step === 1) {
      return (
        <div className={styles.roleSignal}>
          <p className={styles.visualKicker}>Epic leadership demand</p>
          <div className={styles.roleSignalHead}>
            <div><span>Current market share</span><h3>{managerDemand?.label ?? 'IT Manager'}</h3></div>
            <strong>{managerShare}%</strong>
          </div>
          <div className={styles.signalStats}>
            <div><span>Open roles represented</span><strong>~{managerOpenings.toLocaleString()}</strong></div>
            <div><span>Rank beyond analysts</span><strong>#1</strong></div>
          </div>
          <div className={styles.pulseList}>
            <p><i aria-hidden="true" />People leadership requires coaching, delegation, and accountability beyond individual contribution.</p>
            <p><i aria-hidden="true" />External searches expand the pool of proven managers with the right Epic depth.</p>
          </div>
        </div>
      );
    }

    const moduleRanking = (
      <figure aria-label="Thirty-day Epic application movement within Application Analyst demand">
        <figcaption className={styles.figureTitle}>Application movement · 30 days</figcaption>
        {moduleMovement.length
          ? movementBars(moduleMovement.slice(0, 9))
          : <p className={styles.noData}>The application-level movement refresh is still processing.</p>}
        <p className={styles.visualFootnote}>Share-point change within classified Application Analyst demand</p>
      </figure>
    );

    return isContributor ? moduleRanking : (
      <div className={styles.editorialGate}>
        <div aria-hidden="true" className={styles.gatePreview}>{moduleRanking}</div>
        <div className={styles.gateOverlay}>
          <Lock aria-hidden="true" />
          <p className={styles.visualKicker}>Fastest mover: {hottestModule?.label ?? 'Willow'} · {points(hottestModule?.delta30d ?? null)}</p>
          <h3>Unlock the full application movement view.</h3>
          <p>See every tracked Epic application moving up or down over the latest 30-day comparison.</p>
          <button type="button" onClick={openDemandAccess}>Unlock module demand</button>
        </div>
      </div>
    );
  }

  const contribution = (
    <div id="briefing-demand-access" className={styles.contributionSection}>
      <div>
        <p className={styles.eyebrow}>Application-level demand</p>
        <h3>{isContributor ? 'Your data point is part of the benchmark.' : 'See every Epic application moving up or down.'}</h3>
        <p>{isContributor ? 'Thank you for making the market read more useful for everyone.' : 'Share one anonymous salary data point to unlock module movement, functional demand, and deeper compensation cuts.'}</p>
      </div>
      {!isContributor && (
        <button type="button" onClick={() => setGateOpen((open) => !open)} aria-expanded={gateOpen}>
          {gateOpen ? 'Close contribution form' : 'Unlock module demand'} <ChevronDown aria-hidden="true" />
        </button>
      )}
      {isContributor && <span className={styles.contributorThanks}><Check aria-hidden="true" /> Contributor access active</span>}
      {gateOpen && !isContributor && <div className={styles.contributionForm}><ContributionGate /></div>}
    </div>
  );

  return (
    <EditorialChapter
      id="briefing-demand"
      number="02"
      eyebrow="Hiring demand"
      title="Which Epic roles are becoming harder to fill."
      intro="Next, we look at changes in current job postings. The 30-day view shows which functions, leadership roles, and Epic applications are taking a larger share of demand."
      steps={steps}
      renderVisual={(step) => renderVisual(step)}
      after={contribution}
    />
  );
}
