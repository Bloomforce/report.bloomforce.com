'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil } from 'lucide-react';
import { useBenchmark } from '@/hooks/useBenchmark';
import { ordinal } from '@/lib/insights/percentile';
import { SECTION_IDS } from '@/lib/constants';

/** Persistent profile pill — appears once the hero is scrolled past. */
export function FloatingBenchmarkChip() {
  const { profile, roleName, percentile } = useBenchmark();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById(SECTION_IDS.hero);
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setVisible(!e.isIntersecting), { threshold: 0 });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          onClick={() => document.getElementById(SECTION_IDS.hero)?.scrollIntoView({ behavior: 'smooth' })}
          className="fixed bottom-4 left-4 z-40 flex items-center gap-2.5 rounded-full bg-navy text-white pl-4 pr-3 py-2.5 shadow-lg text-[13px] hover:bg-navy-light transition-colors"
        >
          <span className="font-medium">
            {roleName}
            {profile.region !== 'National' && ` · ${profile.region}`}
            {percentile !== null && (
              <span className="text-primary-light font-bold"> · {ordinal(Math.round(percentile))} pctile</span>
            )}
          </span>
          <Pencil className="w-3.5 h-3.5 opacity-70" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
