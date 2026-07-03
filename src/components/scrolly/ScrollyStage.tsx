'use client';

import { useRef, useState, useEffect } from 'react';
import { useScroll, useMotionValueEvent } from 'framer-motion';

interface ScrollyStageProps {
  steps: number;
  /** Renders the pinned viewport; receives the active step + continuous progress. */
  children: (step: number, progress: number) => React.ReactNode;
  /** Stacked-card fallback rendered below the md breakpoint (no pinning). */
  mobileFallback: React.ReactNode;
  /** Scroll length per step, in viewport-heights. */
  vhPerStep?: number;
}

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const fn = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return isDesktop;
}

/**
 * Scrollytelling container: a tall scroll track with a sticky viewport.
 * Progress is continuous (0..1 across the whole track) so visuals can
 * interpolate between steps rather than snap.
 */
export function ScrollyStage({ steps, children, mobileFallback, vhPerStep = 90 }: ScrollyStageProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const isDesktop = useIsDesktop();

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setProgress(v);
    setStep(Math.min(steps - 1, Math.floor(v * steps)));
  });

  if (!isDesktop) return <>{mobileFallback}</>;

  return (
    <div ref={trackRef} style={{ height: `${steps * vhPerStep}vh` }}>
      <div className="sticky top-[100px]" style={{ height: 'calc(100vh - 140px)' }}>
        {children(step, progress)}
      </div>
    </div>
  );
}
