'use client';

import { createContext, useCallback, useEffect, useState } from 'react';
import type { LeadFormData } from '@/lib/types';
import type { ContributionFormData } from '@/lib/insights/types';
import { LEAD_STORAGE_KEY, CONTRIBUTION_STORAGE_KEY } from '@/lib/constants';

export type GateTier = 'anon' | 'email' | 'contributor';

const TIER_ORDER: GateTier[] = ['anon', 'email', 'contributor'];

export interface GateContextType {
  tier: GateTier;
  /** Back-compat: true when tier is at least 'email'. */
  isUnlocked: boolean;
  isContributor: boolean;
  leadData: LeadFormData | null;
  unlock: (data: LeadFormData) => Promise<void>;
  contribute: (data: ContributionFormData) => Promise<void>;
  unlockWithCode: (email: string, code: string) => Promise<void>;
  showModal: () => void;
  hideModal: () => void;
  isModalOpen: boolean;
}

export const GateContext = createContext<GateContextType>({
  tier: 'anon',
  isUnlocked: false,
  isContributor: false,
  leadData: null,
  unlock: async () => {},
  contribute: async () => {},
  unlockWithCode: async () => {},
  showModal: () => {},
  hideModal: () => {},
  isModalOpen: false,
});

export function GateProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTier] = useState<GateTier>('anon');
  const [leadData, setLeadData] = useState<LeadFormData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(CONTRIBUTION_STORAGE_KEY)) {
        setTier('contributor');
      } else if (localStorage.getItem(LEAD_STORAGE_KEY)) {
        setTier('email');
      }
      const stored = localStorage.getItem(LEAD_STORAGE_KEY);
      if (stored) setLeadData(JSON.parse(stored));
    } catch {}
  }, []);

  const unlock = useCallback(async (data: LeadFormData) => {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, page: window.location.href }),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) throw new Error(payload.error || 'Lead submission failed');

    setLeadData(data);
    setTier((prev) => (prev === 'contributor' ? prev : 'email'));
    setIsModalOpen(false);
    try {
      localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(data));
      document.cookie = `bf_unlocked=1;max-age=${365 * 24 * 60 * 60};path=/;SameSite=Lax`;
    } catch {}
  }, []);

  const contribute = useCallback(async (data: ContributionFormData) => {
    const response = await fetch('/api/insights/contribute', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) throw new Error(payload.error || 'Submission failed');

    setTier('contributor');
    try {
      localStorage.setItem(
        CONTRIBUTION_STORAGE_KEY,
        JSON.stringify({ email: data.email, roleKey: data.roleFamily, submittedAt: new Date().toISOString() }),
      );
    } catch {}
  }, []);

  const unlockWithCode = useCallback(async (email: string, code: string) => {
    const response = await fetch('/api/insights/unlock', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) throw new Error(payload.error || 'Code check failed');

    setTier('contributor');
    try {
      localStorage.setItem(
        CONTRIBUTION_STORAGE_KEY,
        JSON.stringify({ email, submittedAt: new Date().toISOString() }),
      );
    } catch {}
  }, []);

  const showModal = useCallback(() => setIsModalOpen(true), []);
  const hideModal = useCallback(() => setIsModalOpen(false), []);

  const cycleTier = useCallback(() => {
    setTier((prev) => TIER_ORDER[(TIER_ORDER.indexOf(prev) + 1) % TIER_ORDER.length]);
  }, []);

  return (
    <GateContext.Provider
      value={{
        tier,
        isUnlocked: tier !== 'anon',
        isContributor: tier === 'contributor',
        leadData,
        unlock,
        contribute,
        unlockWithCode,
        showModal,
        hideModal,
        isModalOpen,
      }}
    >
      {children}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={cycleTier}
          className="fixed bottom-4 right-4 z-50 px-4 py-2 rounded-full text-xs font-semibold shadow-lg transition-colors"
          style={{
            backgroundColor: tier === 'contributor' ? '#1DAFA1' : tier === 'email' ? '#E8A13A' : '#121D2B',
            color: '#fff',
          }}
        >
          {tier === 'contributor' ? '🔓 Contributor' : tier === 'email' ? '🔑 Email' : '🔒 Anon'}
        </button>
      )}
    </GateContext.Provider>
  );
}
