'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useGate } from '@/hooks/useGate';
import type { LeadFormData } from '@/lib/types';

export function LeadCaptureModal() {
  const { isModalOpen, hideModal, unlock } = useGate();
  const [form, setForm] = useState<LeadFormData>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    role: '',
    phone: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await unlock(form);
    setSubmitting(false);
  };

  const update = (field: keyof LeadFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={hideModal} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10"
          >
            <button onClick={hideModal} className="absolute top-4 right-4 text-text-muted hover:text-text">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-[family-name:var(--font-heading)] text-navy mb-2">
              Unlock the Full Report
            </h3>
            <p className="text-text-muted text-sm mb-6">
              Get detailed salary breakdowns by experience, location, education, and more — completely free.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <input
                  required
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <input
                required
                type="email"
                placeholder="Work Email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <input
                required
                placeholder="Company"
                value={form.company}
                onChange={(e) => update('company', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <input
                required
                placeholder="Job Title"
                value={form.role}
                onChange={(e) => update('role', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <input
                placeholder="Phone (optional)"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Unlocking...' : 'Unlock Full Report — Free'}
              </Button>
            </form>

            <p className="text-xs text-text-light text-center mt-4">
              No spam. Your data is used to personalize your experience.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
