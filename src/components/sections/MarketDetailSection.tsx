'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { ContributionGate } from '@/components/gate/ContributionGate';
import { DeltaTag } from '@/components/live/DeltaTag';
import { useBenchmark } from '@/hooks/useBenchmark';
import { useGate } from '@/hooks/useGate';
import { formatK } from '@/lib/insights/format';
import { EMPLOYER_TYPE_LABELS, CREDENTIAL_LABELS, WORK_MODEL_LABELS } from '@/lib/insights/employer-types';
import { SECTION_IDS, BOOK_CALL_URL } from '@/lib/constants';
import type { MarketDetailRow } from '@/lib/insights/types';

function cutLabel(dimension: string, key: string): string {
  if (dimension === 'employerType') return EMPLOYER_TYPE_LABELS[key] ?? key;
  if (dimension === 'credential') return CREDENTIAL_LABELS[key] ?? key;
  return WORK_MODEL_LABELS[key] ?? key;
}

export function MarketDetailSection() {
  const { profile, roleName, guardedRole } = useBenchmark();
  const { isContributor } = useGate();
  const [detail, setDetail] = useState<MarketDetailRow | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    if (!isContributor || guardedRole) return;
    setStatus('loading');
    fetch(`/api/insights/market-detail?role=${encodeURIComponent(profile.roleKey)}`)
      .then((r) => {
        if (!r.ok) throw new Error('locked');
        return r.json();
      })
      .then((d) => {
        setDetail(d);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, [isContributor, guardedRole, profile.roleKey]);

  // Director and VP market detail is call-only: no gate, no fetch, one door.
  if (guardedRole) {
    return (
      <SectionWrapper id={SECTION_IDS.marketDetail} alt>
        <div className="max-w-2xl mx-auto bg-navy rounded-2xl p-8 md:p-10 text-center">
          <h2 className="text-2xl md:text-3xl font-[family-name:var(--font-heading)] text-white mb-3">
            Request access to our leadership data set
          </h2>
          <p className="text-sm text-gray-400 max-w-lg mx-auto mb-6">
            Demand, hiring hotspots, and pay for {roleName.toLowerCase()}s, by market and org type, shared in
            a 20-minute data review.
          </p>
          <Button size="lg" href={`${BOOK_CALL_URL}?utm_source=insights&utm_content=market-detail-guarded-${profile.roleKey}`}>
            <Phone className="w-4 h-4 mr-2" /> Request access
          </Button>
        </div>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper id={SECTION_IDS.marketDetail} alt>
      <div className="text-center mb-10">
        <Badge className="mb-4">The market around your role</Badge>
        <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-heading)] text-navy mb-4">
          How hard is your market working against you?
        </h2>
        <p className="text-text-muted max-w-2xl mx-auto">
          Exact demand, where the hiring concentrates, and the deeper pay cuts for your role. It unlocks when
          you add your own anonymous data point.
        </p>
      </div>

      {!isContributor ? (
        <ContributionGate />
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="flex items-center gap-2 text-sm text-primary font-semibold mb-5">
            <CheckCircle className="w-4 h-4" /> Your number is in. Thank you for making the benchmark better.
          </p>

          {status === 'loading' && <p className="text-text-muted text-sm">Loading the market detail…</p>}
          {status === 'error' && (
            <p className="text-text-muted text-sm">
              We couldn&apos;t load the detail view. Refresh the page, or re-enter your code above.
            </p>
          )}

          {detail && (
            <>
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-ink/10 p-5">
                  <div className="text-xs text-text-muted uppercase tracking-wide font-semibold mb-1">
                    Open {roleName} roles · 12 mo
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-navy font-[family-name:var(--font-mono)] tabular-nums">
                      {detail.demandCount.toLocaleString()}
                    </span>
                    {detail.demandDelta30d !== null && <DeltaTag value={detail.demandDelta30d} unit="pts" period="30d" />}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-ink/10 p-5 sm:col-span-2">
                  <div className="text-xs text-text-muted uppercase tracking-wide font-semibold mb-2">Hiring hotspots</div>
                  <div className="flex flex-wrap gap-2">
                    {detail.hotspots.map((h) => (
                      <span key={h.label} className="text-xs bg-primary-50 text-primary-dark rounded-full px-3 py-1.5 font-medium">
                        {h.label} · {h.openings} openings
                      </span>
                    ))}
                    {!detail.hotspots.length && <span className="text-sm text-text-muted">Mostly remote. Demand isn&apos;t concentrated in any one place.</span>}
                  </div>
                </div>
              </div>

              {detail.cuts.length > 0 && (
                <div className="bg-white rounded-2xl border border-ink/10 p-6 mb-6">
                  <h3 className="text-lg font-[family-name:var(--font-heading)] font-semibold text-navy mb-4">
                    The deep cuts · {roleName}
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {detail.cuts.map((c) => (
                      <div key={`${c.dimension}-${c.label}`} className="border border-ink/10 rounded-xl p-4">
                        <div className="text-xs text-text-muted mb-1">{cutLabel(c.dimension, c.label)}</div>
                        <div className="text-xl font-bold text-navy font-[family-name:var(--font-mono)] tabular-nums">
                          {formatK(c.blended.p50)}
                        </div>
                        <div className="text-[11px] text-text-light mt-0.5">
                          {formatK(c.blended.p25)}–{formatK(c.blended.p75)} · {c.n} reports
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* the tier-3 hook — every unlocked view points at the call */}
              <div className="bg-navy rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5 justify-between">
                <div>
                  <h3 className="text-xl font-[family-name:var(--font-heading)] text-white mb-1.5">
                    This is the summary view.
                  </h3>
                  <p className="text-sm text-gray-400 max-w-xl">
                    The full dataset, including cuts not published on this page, and which employers are
                    competing for the same people in your market: that is a 20-minute call with the person
                    who actually works this market. Not a hand-off.
                  </p>
                </div>
                <Button size="lg" href={`${BOOK_CALL_URL}?utm_source=insights&utm_content=market-detail-${profile.roleKey}`} className="shrink-0">
                  <Phone className="w-4 h-4 mr-2" /> Book the 20 minutes
                </Button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </SectionWrapper>
  );
}
