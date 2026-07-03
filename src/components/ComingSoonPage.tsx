'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LiveDot } from '@/components/live/LiveDot';
import { Button } from '@/components/ui/Button';

const SURVEY_URL = 'https://www.bloomforce.com/survey';

function useCountUp(target: number, duration = 1800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    let raf: number;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

// Takes only the respondent count so nothing else about the new report
// (cell counts, posting volumes) lands in the serialized page payload.
export function ComingSoonPage({ totalRespondents }: { totalRespondents: number }) {
  const respondents = useCountUp(totalRespondents);

  return (
    <div className="min-h-screen bg-navy-deep text-white flex flex-col bg-[radial-gradient(900px_500px_at_50%_-15%,rgba(0,168,150,0.16),transparent)]">
      <header className="max-w-6xl w-full mx-auto px-4 pt-8">
        <a href="https://www.bloomforce.com/" className="inline-flex">
          <img src="/images/logo-white.svg" alt="Bloomforce" className="h-7 opacity-90" />
        </a>
      </header>

      <main className="flex-1 flex items-center px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] uppercase text-primary-light bg-white/5 ring-1 ring-white/10 px-4 py-2 rounded-full">
              <LiveDot size={7} />
              In the works
            </span>
            <h1 className="text-4xl md:text-6xl font-[family-name:var(--font-heading)] font-bold mt-7 mb-5 leading-[1.05] tracking-tight">
              This year, we&apos;re doing something different.
            </h1>
            <p className="text-lg md:text-xl text-white/65 max-w-2xl mx-auto">
              The next EHR workforce report won&apos;t look like anything we&apos;ve published
              before — or anything anyone else has, either. That&apos;s all we&apos;re saying
              for now.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-12"
          >
            <div className="text-5xl md:text-6xl font-bold text-white font-[family-name:var(--font-mono)] tabular-nums">
              {respondents.toLocaleString()}
            </div>
            <div className="text-xs uppercase tracking-[0.15em] text-white/50 mt-2">
              EHR professionals counted so far
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12"
          >
            <p className="text-white/75 mb-5 max-w-xl mx-auto">
              The 2026 survey is open now. Five to seven minutes, fully anonymous — and
              you&apos;re in it the day it drops.
            </p>
            <Button size="lg" href={SURVEY_URL}>
              Make it {(totalRespondents + 1).toLocaleString()} — take the survey →
            </Button>
            <div className="mt-8">
              <a
                href="/2025"
                className="text-sm text-white/50 hover:text-primary-light underline underline-offset-4 transition-colors"
              >
                Browse the 2025 report while you wait
              </a>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="max-w-6xl w-full mx-auto px-4 pb-8 flex items-center justify-center text-xs text-white/40">
        <span>&copy; {new Date().getFullYear()} bloomforce, LLC. All Rights Reserved.</span>
      </footer>
    </div>
  );
}
