'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { FreshnessPill } from '@/components/live/FreshnessPill';
import { SectionCTABand } from '@/components/sections/SectionCTABand';
import { GatedContent } from '@/components/gate/GatedContent';
import { useBenchmark } from '@/hooks/useBenchmark';
import { formatK, formatSignedK } from '@/lib/insights/format';
import { SECTION_IDS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { BenchmarkRow, Seniority } from '@/lib/insights/types';

const IC_LADDER: { level: Seniority; label: string }[] = [
  { level: 'L1', label: 'Early career' },
  { level: 'L2', label: 'Mid' },
  { level: 'L3', label: 'Senior' },
  { level: 'L4', label: 'Lead / Architect' },
];

const LEADERSHIP: { family: string; level: Seniority; label: string }[] = [
  { family: 'MGR', level: 'M1', label: 'Manager' },
  { family: 'DIR', level: 'M2', label: 'Director' },
  { family: 'VP', level: 'M3', label: 'VP' },
  { family: 'EXEC', level: 'exec', label: 'CIO / CMIO / CNIO' },
];

function nationalCell(rows: BenchmarkRow[], family: string, level: Seniority | 'ALL') {
  return rows.find(
    (r) =>
      r.roleFamily === family &&
      r.seniority === level &&
      r.region === 'National' &&
      r.workModel === 'all' &&
      r.employerType === 'all',
  );
}

export function CareerLadderSection() {
  const { data, profile, setProfile, roleName } = useBenchmark();

  const icCells = IC_LADDER.map((rung) => ({ ...rung, cell: nationalCell(data.benchmarks, profile.roleKey, rung.level) }));
  const presentIc = icCells.filter((r) => r.cell);
  const leadCells = LEADERSHIP.map((rung) => ({ ...rung, cell: nationalCell(data.benchmarks, rung.family, rung.level) ?? nationalCell(data.benchmarks, rung.family, 'ALL') }));

  // "Is management worth it" — the jump from senior IC to manager
  const seniorIc = presentIc.at(-1)?.cell;
  const mgr = leadCells[0]?.cell;
  const mgmtJump = seniorIc && mgr ? mgr.blended.p50 - seniorIc.blended.p50 : null;

  return (
    <SectionWrapper id={SECTION_IDS.ladder}>
      <div className="text-center mb-10">
        <Badge className="mb-4">Career pathing</Badge>
        <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-heading)] text-navy mb-4">
          Where the real jumps happen
        </h2>
        <p className="text-text-muted max-w-2xl mx-auto">
          The ladder from {roleName.toLowerCase()} to the C-suite — every rung a blended market number.
          Click a rung to benchmark it above.
        </p>
      </div>

      {/* IC ladder for the selected family */}
      {presentIc.length >= 2 && (
        <div className="bg-white rounded-2xl border border-ink/10 shadow-sm shadow-ink/[0.03] p-6 md:p-8 mb-6">
          <h3 className="text-lg font-[family-name:var(--font-heading)] font-semibold text-navy mb-6">{roleName} · by level</h3>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${presentIc.length}, minmax(0,1fr))` }}>
            {presentIc.map((rung, i) => {
              const prev = i > 0 ? presentIc[i - 1].cell : null;
              const jump = prev && rung.cell ? rung.cell.blended.p50 - prev.blended.p50 : null;
              const active = profile.seniority === rung.level;
              return (
                <motion.button
                  key={rung.level}
                  whileHover={{ y: -2 }}
                  onClick={() => {
                    setProfile({ seniority: rung.level });
                    document.getElementById(SECTION_IDS.hero)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={cn(
                    'rounded-xl border p-4 text-center transition-colors',
                    active ? 'border-primary bg-primary-50' : 'border-ink/10 hover:border-primary/50',
                  )}
                >
                  <div className="text-xs text-text-muted mb-1">{rung.label}</div>
                  <div className="text-xl font-bold text-navy font-[family-name:var(--font-mono)] tabular-nums">
                    {formatK(rung.cell!.blended.p50)}
                  </div>
                  {jump !== null && jump > 0 && (
                    <div className="text-[11px] font-semibold text-primary mt-1">{formatSignedK(jump)} vs prior rung</div>
                  )}
                  <div className="text-[10px] text-text-light mt-1">n={rung.cell!.n}</div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Leadership ladder */}
      <div className="bg-white rounded-2xl border border-ink/10 shadow-sm shadow-ink/[0.03] p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <h3 className="text-lg font-[family-name:var(--font-heading)] font-semibold text-navy">The leadership ladder</h3>
          {mgmtJump !== null && (
            <span className="text-sm text-text-muted">
              Stepping from senior IC to manager is worth{' '}
              <span className="font-semibold text-primary">{formatSignedK(mgmtJump)}</span> at the median — the
              bigger jumps come later.
            </span>
          )}
        </div>
        <GatedContent message="Unlock the full leadership breakdown — Manager through CIO, with ranges and regional cuts">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            {leadCells.map((rung) => (
              <button
                key={rung.family}
                onClick={() => {
                  setProfile({ roleKey: rung.family, seniority: 'ALL' });
                  document.getElementById(SECTION_IDS.hero)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={cn(
                  'rounded-xl border p-5 text-left transition-colors',
                  profile.roleKey === rung.family ? 'border-primary bg-primary-50' : 'border-ink/10 hover:border-primary/50',
                )}
              >
                <div className="text-sm font-semibold text-navy">{rung.label}</div>
                {rung.cell ? (
                  <>
                    <div className="text-2xl font-bold text-navy font-[family-name:var(--font-mono)] tabular-nums mt-2">
                      {formatK(rung.cell.blended.p50)}
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      {formatK(rung.cell.blended.p25)}–{formatK(rung.cell.blended.p75)} typical
                    </div>
                    <div className="mt-2">
                      <FreshnessPill n={rung.cell.n} confidenceTier={rung.cell.confidenceTier} />
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-text-light mt-2">Awaiting enough public data — not guessed.</div>
                )}
              </button>
            ))}
          </div>
        </GatedContent>
      </div>

      <SectionCTABand
        title="Planning your next move?"
        subtitle={`Talk through the ${roleName.toLowerCase()} market with the person who actually works it — no pitch, just data.`}
        buttonLabel="Book a 20-min data review"
        href={`#${SECTION_IDS.cta}`}
      />
    </SectionWrapper>
  );
}
