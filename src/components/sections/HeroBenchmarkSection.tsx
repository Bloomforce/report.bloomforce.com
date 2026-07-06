'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select } from '@/components/ui/Select';
import { PercentileTrack } from '@/components/charts/PercentileTrack';
import { FreshnessPill } from '@/components/live/FreshnessPill';
import { LiveDot } from '@/components/live/LiveDot';
import { DeltaTag } from '@/components/live/DeltaTag';
import { Sparkline } from '@/components/charts/Sparkline';
import { useBenchmark } from '@/hooks/useBenchmark';
import { formatK } from '@/lib/insights/format';
import { percentileLabel } from '@/lib/insights/percentile';
import { SECTION_IDS } from '@/lib/constants';
import type { Seniority } from '@/lib/insights/types';

const LEVEL_OPTIONS: { value: Seniority | 'ALL'; label: string; guarded?: boolean }[] = [
  { value: 'ALL', label: 'All levels' },
  { value: 'L1', label: 'Early career (0–3 yrs)' },
  { value: 'L2', label: 'Mid (4–8 yrs)' },
  { value: 'L3', label: 'Senior (9+ yrs)' },
  { value: 'L4', label: 'Lead / Principal / Architect' },
  { value: 'M1', label: 'Manager / Supervisor' },
  { value: 'M2', label: 'Director · shared in a data review', guarded: true },
  { value: 'M3', label: 'VP · shared in a data review', guarded: true },
  { value: 'exec', label: 'C-suite · shared in a data review', guarded: true },
];

/** Director and above are call-only: visible in the picker, never priced on the page. */
const GUARDED_ROLES = [
  { roleKey: 'DIR', label: 'IT Director · shared in a data review' },
  { roleKey: 'VP', label: 'VP of IT / IS · shared in a data review' },
  { roleKey: 'EXEC', label: 'CIO / CMIO / CNIO · shared in a data review' },
];

export function HeroBenchmarkSection() {
  const { data, profile, setProfile, row, fallbackNote, roleName, percentile, deltas } = useBenchmark();
  const [compInput, setCompInput] = useState(profile.comp ? String(profile.comp) : '');

  const roleGroups = [...new Set(data.roles.map((r) => r.group))];
  const availableLevels = LEVEL_OPTIONS.filter(
    (l) =>
      l.value === 'ALL' ||
      l.guarded ||
      data.benchmarks.some((b) => b.roleFamily === profile.roleKey && b.seniority === l.value),
  );

  function commitComp(value: string) {
    const parsed = parseInt(value.replace(/[^0-9]/g, ''), 10);
    setProfile({ comp: Number.isFinite(parsed) && parsed >= 10000 && parsed <= 2000000 ? parsed : undefined });
  }

  return (
    <section id={SECTION_IDS.hero} className="pt-40 pb-10 px-4 bg-[radial-gradient(1100px_380px_at_80%_-10%,rgba(0,168,150,0.10),transparent)]">
      <div className="max-w-6xl mx-auto">
        <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.1em] uppercase text-primary bg-primary-50 px-3.5 py-1.5 rounded-full">
          <LiveDot size={7} />
          The living EHR talent benchmark
        </span>
        <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-heading)] font-bold text-navy mt-5 mb-3 max-w-3xl leading-[1.08] tracking-tight">
          Know where you stand, <em className="not-italic text-primary">as of this week</em>.
        </h1>
        <p className="text-lg text-text-muted max-w-2xl mb-8">
          Real pay from verified professionals, kept current with live market data. One number per role,
          level, and market. Pick yours and see where you stand.
        </p>

        <div className="bg-white rounded-2xl border border-ink/10 shadow-sm shadow-ink/[0.03]">
          {/* controls */}
          <div className="flex flex-wrap items-end gap-4 p-6 border-b border-ink/5">
            <Select
              label="Your role"
              className="min-w-[260px]"
              value={profile.roleKey}
              onChange={(e) => setProfile({ roleKey: e.target.value, seniority: 'ALL' })}
              options={[
                ...roleGroups.flatMap((g) =>
                  data.roles.filter((r) => r.group === g).map((r) => ({ value: r.roleKey, label: r.label })),
                ),
                ...GUARDED_ROLES.filter((gr) => !data.roles.some((r) => r.roleKey === gr.roleKey)).map((gr) => ({
                  value: gr.roleKey,
                  label: gr.label,
                  disabled: true,
                })),
              ]}
            />
            <Select
              label="Level"
              value={profile.seniority}
              onChange={(e) => setProfile({ seniority: e.target.value as Seniority | 'ALL' })}
              options={availableLevels.map((l) => ({ value: l.value, label: l.label, disabled: l.guarded }))}
            />
            <Select
              label="Market"
              value={profile.region}
              onChange={(e) => setProfile({ region: e.target.value })}
              options={data.regions.map((r) => ({ value: r, label: r }))}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-navy" htmlFor="hero-comp">
                Your base salary <span className="font-normal text-text-light">(optional)</span>
              </label>
              <input
                id="hero-comp"
                inputMode="numeric"
                placeholder="$ 118,000"
                value={compInput}
                onChange={(e) => setCompInput(e.target.value)}
                onBlur={(e) => commitComp(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && commitComp(compInput)}
                className="px-5 py-3 rounded-full border-2 border-primary/30 bg-white text-navy text-base font-medium w-[170px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="ml-auto hidden lg:block">
              {row && <FreshnessPill n={row.n} confidenceTier={row.confidenceTier} updatedAt={row.updatedAt} />}
            </div>
            <p className="w-full text-xs text-text-light">
              Director, VP, and C-suite numbers never appear on this page. We share them in a{' '}
              <a href={`#${SECTION_IDS.cta}`} className="text-primary underline underline-offset-2">
                data review
              </a>
              .
            </p>
          </div>

          {row ? (
            <div className="p-6 md:p-8">
              {/* headline numbers */}
              <div className="flex flex-wrap gap-x-10 gap-y-4 mb-2">
                <div>
                  <div className="text-xs text-text-muted uppercase tracking-wide font-semibold mb-1">Market median</div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl font-bold text-navy font-[family-name:var(--font-mono)] tabular-nums">
                      {formatK(row.blended.p50)}
                    </span>
                    {row.medianDelta90d !== null && <DeltaTag value={row.medianDelta90d} period="90d" />}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-text-muted uppercase tracking-wide font-semibold mb-1">Typical range (middle half)</div>
                  <span className="text-3xl font-bold text-navy font-[family-name:var(--font-mono)] tabular-nums">
                    {formatK(row.blended.p25)}–{formatK(row.blended.p75)}
                  </span>
                </div>
                {row.spark && row.spark.length >= 4 && (
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wide font-semibold mb-1">12-mo market trend</div>
                    <Sparkline data={row.spark} width={110} height={34} fill />
                  </div>
                )}
                {row.remoteShare !== null && (
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wide font-semibold mb-1">Fully remote</div>
                    <span className="text-3xl font-bold text-navy font-[family-name:var(--font-mono)] tabular-nums">
                      {Math.round(row.remoteShare * 100)}%
                    </span>
                  </div>
                )}
              </div>

              <PercentileTrack percentiles={row.blended} comp={profile.comp} />

              <AnimatePresence>
                {percentile !== null && deltas && (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-navy text-[15px] mt-1"
                  >
                    You&apos;re {percentileLabel(percentile)},{' '}
                    <span className={deltas.vsMedian >= 0 ? 'text-primary font-semibold' : 'text-[var(--color-down)] font-semibold'}>
                      {formatK(Math.abs(deltas.vsMedian))} {deltas.vsMedian >= 0 ? 'above' : 'below'} the median
                    </span>{' '}
                    for {profile.seniority === 'ALL' ? '' : `${LEVEL_OPTIONS.find((l) => l.value === profile.seniority)?.label.toLowerCase()} `}
                    {roleName}s in {profile.region === 'National' ? 'the national market' : `the ${profile.region}`}.
                  </motion.p>
                )}
              </AnimatePresence>

              {fallbackNote && (
                <p className="text-xs text-[var(--color-warn)] mt-3 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-warn)]" />
                  {fallbackNote}
                </p>
              )}
              <div className="lg:hidden mt-4">
                <FreshnessPill n={row.n} confidenceTier={row.confidenceTier} updatedAt={row.updatedAt} />
              </div>
            </div>
          ) : (
            <div className="p-8 text-text-muted text-sm">
              We don&apos;t have enough reports for this exact role, level, and market yet. It publishes
              automatically as soon as enough people share their numbers.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
