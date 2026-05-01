'use client';

import { createContext, useCallback, useEffect, useState } from 'react';
import type { LeadFormData } from '@/lib/types';
import { LEAD_STORAGE_KEY } from '@/lib/constants';

const FORM_SUBMIT_ENDPOINT = 'https://formsubmit.co/ajax/7426275000499c11e9bf5cd4616c119d';

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
    const formData = new FormData();
    formData.append('_subject', 'Bloomforce report access request');
    formData.append('_template', 'table');
    formData.append('_captcha', 'false');
    formData.append('_replyto', data.email);
    formData.append('_url', window.location.href);
    formData.append('name', `${data.firstName} ${data.lastName}`);
    formData.append('first_name', data.firstName);
    formData.append('last_name', data.lastName);
    formData.append('email', data.email);
    formData.append('company', data.company);
    formData.append('role', data.role);
    formData.append('phone', data.phone || '');
    formData.append('source', 'bloomforce-insights-2025');
    formData.append('page', window.location.href);
    formData.append('submitted_at', new Date().toISOString());

    const response = await fetch(FORM_SUBMIT_ENDPOINT, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData,
    });
    const payload = (await response.json().catch(() => ({}))) as {
      success?: string | boolean;
      message?: string;
    };

    if (!response.ok || payload.success === false || payload.success === 'false') {
      throw new Error(payload.message || 'Lead submission failed');
    }

    setLeadData(data);
    setIsUnlocked(true);
    setIsModalOpen(false);

    try {
      localStorage.setItem(LEAD_STORAGE_KEY, JSON.stringify(data));
      document.cookie = `bf_unlocked=1;max-age=${365 * 24 * 60 * 60};path=/;SameSite=Lax`;
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
