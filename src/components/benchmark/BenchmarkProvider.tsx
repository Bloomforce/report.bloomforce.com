'use client';

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { BenchmarkProfile, BenchmarkRow, InsightsData, Seniority } from '@/lib/insights/types';
import { estimatePercentile } from '@/lib/insights/percentile';

const PROFILE_STORAGE_KEY = 'bf_profile';

export interface BenchmarkContextValue {
  data: InsightsData;
  profile: BenchmarkProfile;
  setProfile: (patch: Partial<BenchmarkProfile>) => void;
  /** Resolved benchmark cell for the profile (with region/seniority fallback). */
  row: BenchmarkRow | null;
  /** Set when the requested cell was thin and we fell back to a broader one. */
  fallbackNote: string | null;
  roleName: string;
  percentile: number | null;
  deltas: { vsMedian: number; vsP75: number } | null;
  /** Benchmark rows for the profile's role family (all cuts) — for sections. */
  familyRows: BenchmarkRow[];
}

export const BenchmarkContext = createContext<BenchmarkContextValue | null>(null);

function findCell(
  rows: BenchmarkRow[],
  roleKey: string,
  seniority: Seniority | 'ALL',
  region: string,
): { row: BenchmarkRow | null; note: string | null } {
  const base = rows.filter((r) => r.workModel === 'all' && r.employerType === 'all');
  const match = (s: Seniority | 'ALL', reg: string) =>
    base.find((r) => r.roleFamily === roleKey && r.seniority === s && r.region === reg) ?? null;

  let row = match(seniority, region);
  if (row) return { row, note: null };

  if (seniority !== 'ALL') {
    row = match('ALL', region);
    if (row) return { row, note: `Showing all levels. ${region === 'National' ? 'This level' : `${region} at this level`} needs more data` };
  }
  if (region !== 'National') {
    row = match(seniority, 'National');
    if (row) return { row, note: `Showing the national market. ${region} needs more data` };
    row = match('ALL', 'National');
    if (row) return { row, note: `Showing the national market, all levels. This exact combination needs more data` };
  }
  return { row: null, note: null };
}

export function BenchmarkProvider({ data, children }: { data: InsightsData; children: React.ReactNode }) {
  const defaultRole = data.roles[0]?.roleKey ?? 'AA';
  const [profile, setProfileState] = useState<BenchmarkProfile>({
    roleKey: defaultRole,
    seniority: 'ALL',
    region: 'National',
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as BenchmarkProfile;
        if (data.roles.some((r) => r.roleKey === parsed.roleKey)) {
          setProfileState((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setProfile = useCallback((patch: Partial<BenchmarkProfile>) => {
    setProfileState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const value = useMemo<BenchmarkContextValue>(() => {
    const { row, note } = findCell(data.benchmarks, profile.roleKey, profile.seniority, profile.region);
    const roleName = data.roles.find((r) => r.roleKey === profile.roleKey)?.label ?? profile.roleKey;
    const percentile = row && profile.comp ? estimatePercentile(profile.comp, row.blended) : null;
    const deltas =
      row && profile.comp
        ? { vsMedian: profile.comp - row.blended.p50, vsP75: profile.comp - row.blended.p75 }
        : null;
    const familyRows = data.benchmarks.filter((r) => r.roleFamily === profile.roleKey);
    return { data, profile, setProfile, row, fallbackNote: note, roleName, percentile, deltas, familyRows };
  }, [data, profile, setProfile]);

  return <BenchmarkContext.Provider value={value}>{children}</BenchmarkContext.Provider>;
}
