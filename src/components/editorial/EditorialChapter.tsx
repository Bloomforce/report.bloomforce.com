'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import styles from './editorial.module.css';

export interface EditorialStoryStep {
  label: string;
  title: string;
  body: string;
  evidence?: string;
}

interface EditorialChapterProps {
  id: string;
  number: string;
  eyebrow: string;
  title: string;
  intro: string;
  steps: EditorialStoryStep[];
  tone?: 'paper' | 'ink';
  renderVisual: (step: number, mobile: boolean) => React.ReactNode;
  after?: React.ReactNode;
}

export function EditorialChapter({
  id,
  number,
  eyebrow,
  title,
  intro,
  steps,
  tone = 'paper',
  renderVisual,
  after,
}: EditorialChapterProps) {
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleStep = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top))[0];

        if (visibleStep) {
          const next = Number((visibleStep.target as HTMLElement).dataset.step);
          setActiveStep((current) => (current === next ? current : next));
        }
      },
      { rootMargin: '-35% 0px -50% 0px', threshold: 0 },
    );

    stepRefs.current.forEach((step) => {
      if (step) observer.observe(step);
    });

    return () => observer.disconnect();
  }, [steps.length]);

  return (
    <section id={id} className={`${styles.chapter} ${tone === 'ink' ? styles.chapterInk : ''}`}>
      <div className={styles.chapterIntro}>
        <div className={styles.chapterIndex} aria-hidden="true">
          {number}
        </div>
        <div>
          <p className={styles.eyebrow}>{eyebrow}</p>
          <h2>{title}</h2>
          <p className={styles.chapterLead}>{intro}</p>
        </div>
      </div>

      <div className={styles.desktopStory}>
        <div className={styles.storyCopy}>
          {steps.map((step, index) => (
            <article
              key={step.label}
              ref={(node) => {
                stepRefs.current[index] = node;
              }}
              data-step={index}
              className={`${styles.storyStep} ${activeStep === index ? styles.storyStepActive : ''}`}
              aria-current={activeStep === index ? 'step' : undefined}
            >
              <p className={styles.stepLabel}>{step.label}</p>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              {step.evidence && <p className={styles.stepEvidence}>{step.evidence}</p>}
            </article>
          ))}
        </div>

        <div className={styles.stickyVisual}>
          <motion.div
            key={activeStep}
            className={styles.visualSurface}
            initial={reducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderVisual(activeStep, false)}
          </motion.div>
          <div className={styles.stepProgress} aria-hidden="true">
            {steps.map((step, index) => (
              <span key={step.label} className={activeStep === index ? styles.stepProgressActive : ''} />
            ))}
          </div>
        </div>
      </div>

      <div className={styles.mobileStory}>
        {steps.map((step, index) => (
          <article key={step.label} className={styles.mobileStep}>
            <div className={styles.mobileStepCopy}>
              <p className={styles.stepLabel}>{step.label}</p>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              {step.evidence && <p className={styles.stepEvidence}>{step.evidence}</p>}
            </div>
            <div className={styles.mobileVisual}>{renderVisual(index, true)}</div>
          </article>
        ))}
      </div>

      {after}
    </section>
  );
}
