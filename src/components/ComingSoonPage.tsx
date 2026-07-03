'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LiveDot } from '@/components/live/LiveDot';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/insights/format';
import type { FreshnessMeta } from '@/lib/insights/types';

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

function Stat({ value, label }: { value: number; label: string }) {
  const n = useCountUp(value);
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-white font-[family-name:var(--font-mono)] tabular-nums">
        {n.toLocaleString()}
      </div>
      <div className="text-xs uppercase tracking-[0.15em] text-white/50 mt-1.5">{label}</div>
    </div>
  );
}

export function ComingSoonPage({ freshness }: { freshness: FreshnessMeta }) {
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
              Compiling now
            </span>
            <h1 className="text-4xl md:text-6xl font-[family-name:var(--font-heading)] font-bold mt-7 mb-5 leading-[1.05] tracking-tight">
              The next EHR workforce report won&apos;t be a report.
            </h1>
            <p className="text-lg md:text-xl text-white/65 max-w-2xl mx-auto">
              We&apos;re blending verified professional salaries with thousands of live Epic-IT job
              postings into a living benchmark — pay, demand, and sentiment by role, level, and
              market. Updated continuously, not annually.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-wrap justify-center gap-x-14 gap-y-6 mt-12"
          >
            <Stat value={freshness.totalRespondents} label="Verified professionals" />
            <Stat value={freshness.postingsIngested} label="Job postings analyzed" />
            <Stat value={freshness.benchmarkCells} label="Benchmark cells built" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12"
          >
            <p className="text-white/75 mb-5 max-w-xl mx-auto">
              The 2026 survey is collecting now. Take 5–7 minutes and your data point is in the
              benchmark on day one — anonymous, and you&apos;ll see exactly where you stand.
            </p>
            <Button size="lg" href={SURVEY_URL}>
              Take the 2026 survey →
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

      <footer className="max-w-6xl w-full mx-auto px-4 pb-8 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-white/40">
        <span>&copy; {new Date().getFullYear()} bloomforce, LLC. All Rights Reserved.</span>
        <span className="font-[family-name:var(--font-mono)]">
          data as of {formatDate(freshness.asOf)} · {freshness.windowLabel}
        </span>
      </footer>
    </div>
  );
}
