'use client';

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { BenchmarkProfile, BenchmarkRow, InsightsData, Seniority } from '@/lib/insights/types';
import { estimatePercentile } from '@/lib/insights/percentile';
import { GUARDED_ROLE_LABELS } from '@/lib/constants';

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
  /** True when the selected role's numbers are call-only (Director, VP). */
  guardedRole: boolean;
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
  const base = rows.filter((r) => r.module === 'all' && r.workModel === 'all' && r.employerType === 'all');
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

interface BenchmarkProviderProps {
  data: InsightsData;
  children: React.ReactNode;
  initialProfile?: BenchmarkProfile;
  persistProfile?: boolean;
}

export function BenchmarkProvider({
  data,
  children,
  initialProfile,
  persistProfile = true,
}: BenchmarkProviderProps) {
  const defaultRole = initialProfile?.roleKey ?? data.roles[0]?.roleKey ?? 'AA';
  const [profile, setProfileState] = useState<BenchmarkProfile>({
    roleKey: defaultRole,
    seniority: initialProfile?.seniority ?? 'ALL',
    region: initialProfile?.region ?? 'National',
    comp: initialProfile?.comp,
  });

  useEffect(() => {
    if (!persistProfile) return;
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as BenchmarkProfile;
        if (data.roles.some((r) => r.roleKey === parsed.roleKey) || parsed.roleKey in GUARDED_ROLE_LABELS) {
          setProfileState((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {}
  }, [data.roles, persistProfile]);

  const setProfile = useCallback((patch: Partial<BenchmarkProfile>) => {
    setProfileState((prev) => {
      const next = { ...prev, ...patch };
      if (persistProfile) {
        try {
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  }, [persistProfile]);

  const value = useMemo<BenchmarkContextValue>(() => {
    const guardedRole = profile.roleKey in GUARDED_ROLE_LABELS;
    const { row, note } = guardedRole
      ? { row: null, note: null }
      : findCell(data.benchmarks, profile.roleKey, profile.seniority, profile.region);
    const roleName =
      data.roles.find((r) => r.roleKey === profile.roleKey)?.label ??
      GUARDED_ROLE_LABELS[profile.roleKey] ??
      profile.roleKey;
    const percentile = row && profile.comp ? estimatePercentile(profile.comp, row.blended) : null;
    const deltas =
      row && profile.comp
        ? { vsMedian: profile.comp - row.blended.p50, vsP75: profile.comp - row.blended.p75 }
        : null;
    const familyRows = data.benchmarks.filter((r) => r.roleFamily === profile.roleKey && r.module === 'all');
    return { data, profile, setProfile, row, fallbackNote: note, roleName, guardedRole, percentile, deltas, familyRows };
  }, [data, profile, setProfile]);

  return <BenchmarkContext.Provider value={value}>{children}</BenchmarkContext.Provider>;
}
