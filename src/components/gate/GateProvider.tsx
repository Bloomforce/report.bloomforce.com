'use client';

import { createContext, useCallback, useEffect, useState } from 'react';
import type { LeadFormData } from '@/lib/types';
import { LEAD_STORAGE_KEY } from '@/lib/constants';

export interface GateContextType {
  isUnlocked: boolean;
  leadData: LeadFormData | null;
  unlock: (data: LeadFormData) => Promise<void>;
  showModal: () => void;
  hideModal: () => void;
  isModalOpen: boolean;
}

export const GateContext = createContext<GateContextType>({
  isUnlocked: false,
  leadData: null,
  unlock: async () => {},
  showModal: () => {},
  hideModal: () => {},
  isModalOpen: false,
});

export function GateProvider({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [leadData, setLeadData] = useState<LeadFormData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LEAD_STORAGE_KEY);
      if (stored) {
        setLeadData(JSON.parse(stored));
        setIsUnlocked(true);
      }
    } catch {}
  }, []);

  const unlock = useCallback(async (data: LeadFormData) => {
    setLeadData(data);
    setIsUnlocked(true);
    setIsModalOpen(false);

    try {
      localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(data));
      document.cookie = `bf_unlocked=1;max-age=${365 * 24 * 60 * 60};path=/;SameSite=Lax`;
    } catch {}

    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {}
  }, []);

  const showModal = useCallback(() => setIsModalOpen(true), []);
  const hideModal = useCallback(() => setIsModalOpen(false), []);

  const toggleGate = useCallback(() => setIsUnlocked((prev) => !prev), []);

  return (
    <GateContext.Provider value={{ isUnlocked, leadData, unlock, showModal, hideModal, isModalOpen }}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={toggleGate}
          className="fixed bottom-4 right-4 z-50 px-4 py-2 rounded-full text-xs font-semibold shadow-lg transition-colors"
          style={{
            backgroundColor: isUnlocked ? '#1DAFA1' : '#121D2B',
            color: '#fff',
          }}
        >
          {isUnlocked ? '🔓 Unlocked' : '🔒 Locked'}
        </button>
      )}
    </GateContext.Provider>
  );
}
