'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useBenchmark } from '@/hooks/useBenchmark';
import { useGate } from '@/hooks/useGate';
import { EMPLOYER_TYPE_LABELS } from '@/lib/insights/employer-types';
import type { ContributionFormData, Seniority } from '@/lib/insights/types';

const LEVELS: { value: Seniority; label: string }[] = [
  { value: 'L1', label: 'Early career (0–3 yrs)' },
  { value: 'L2', label: 'Mid (4–8 yrs)' },
  { value: 'L3', label: 'Senior (9+ yrs)' },
  { value: 'L4', label: 'Lead / Principal / Architect' },
  { value: 'M1', label: 'Manager / Supervisor' },
  { value: 'M2', label: 'Director' },
  { value: 'M3', label: 'VP' },
  { value: 'exec', label: 'C-suite' },
];

const inputCls =
  'px-4 py-2.5 rounded-xl border border-ink/15 bg-white text-navy text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary w-full';

/**
 * The give-to-get gate: contribute your comp (anonymous) → the market detail
 * view unlocks instantly. Not a blur — the panel replaces the content, with
 * labeled skeletons above it showing exactly what's being traded for.
 */
export function ContributionGate() {
  const { data, profile, roleName } = useBenchmark();
  const { contribute, unlockWithCode } = useGate();

  const [form, setForm] = useState<Partial<ContributionFormData>>({
    roleFamily: profile.roleKey,
    seniority: profile.seniority === 'ALL' ? undefined : profile.seniority,
    region: profile.region === 'National' ? undefined : profile.region,
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [error, setError] = useState('');
  const [codeMode, setCodeMode] = useState(false);
  const [codeEmail, setCodeEmail] = useState('');
  const [code, setCode] = useState('');

  function set<K extends keyof ContributionFormData>(key: K, value: ContributionFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setError('');
    if (!form.roleFamily || !form.seniority || !form.employerType || !form.region || !form.baseComp || !form.email) {
      setError('Everything except bonus and work model is required.');
      return;
    }
    setStatus('submitting');
    try {
      await contribute(form as ContributionFormData);
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      return;
    }
    setStatus('idle');
  }

  async function submitCode() {
    setError('');
    setStatus('submitting');
    try {
      await unlockWithCode(codeEmail, code);
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'That code didn’t match');
      return;
    }
    setStatus('idle');
  }

  return (
    <div className="relative">
      {/* labeled skeletons — show exactly what unlocks */}
      <div className="grid sm:grid-cols-3 gap-3 mb-6" aria-hidden="true">
        {[
          `Open ${roleName} roles right now`,
          'Where the hiring actually is',
          'Pay by employer type & work model',
        ].map((label) => (
          <div key={label} className="bg-white rounded-xl border border-ink/10 p-4">
            <div className="text-xs text-text-muted mb-2">{label}</div>
            <div className="h-7 w-24 rounded-md bg-gradient-to-r from-bg-subtle via-primary-50 to-bg-subtle animate-pulse" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border-2 border-dashed border-primary/40 p-6 md:p-8">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-primary mb-1.5">
          <Lock className="w-3.5 h-3.5" /> Add your number · unlocks instantly
        </div>
        <h3 className="text-xl font-[family-name:var(--font-heading)] font-semibold text-navy mb-1">
          This benchmark is built by the people in it
        </h3>
        <p className="text-sm text-text-muted mb-6 max-w-xl">
          Add your number, anonymously, and the market detail opens right away. We store the number and the
          role, never your name. Your email is only for your return-visit code.
        </p>

        {!codeMode ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              <select className={inputCls} value={form.roleFamily ?? ''} onChange={(e) => set('roleFamily', e.target.value)}>
                <option value="">Role…</option>
                {data.roles.map((r) => (
                  <option key={r.roleKey} value={r.roleKey}>{r.label}</option>
                ))}
              </select>
              <select className={inputCls} value={form.seniority ?? ''} onChange={(e) => set('seniority', e.target.value as Seniority)}>
                <option value="">Level…</option>
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
              <select className={inputCls} value={form.region ?? ''} onChange={(e) => set('region', e.target.value)}>
                <option value="">Your market…</option>
                {data.regions.filter((r) => r !== 'National').map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <select className={inputCls} value={form.employerType ?? ''} onChange={(e) => set('employerType', e.target.value)}>
                <option value="">Employer type…</option>
                {Object.entries(EMPLOYER_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <input
                className={inputCls}
                inputMode="numeric"
                placeholder="Base salary USD *"
                onChange={(e) => set('baseComp', parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0)}
              />
              <input
                className={inputCls}
                inputMode="numeric"
                placeholder="Bonus (optional)"
                onChange={(e) => {
                  const v = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
                  set('bonusComp', Number.isFinite(v) ? v : (undefined as unknown as number));
                }}
              />
              <select className={inputCls} value={form.workModel ?? ''} onChange={(e) => set('workModel', (e.target.value || undefined) as ContributionFormData['workModel'])}>
                <option value="">Work model (optional)…</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
              <input
                className={`${inputCls} lg:col-span-2`}
                type="email"
                placeholder="Work email for your access code *"
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-[var(--color-down)] mb-3">{error}</p>}
            <Button onClick={submit} disabled={status === 'submitting'} className="w-full sm:w-auto">
              {status === 'submitting' ? 'Adding your data point…' : 'Add my number & unlock →'}
            </Button>
            <p className="text-xs text-text-light mt-3">
              Anonymous by design. New contributions are quarantined and cleaned before they touch any published
              number.{' '}
              <button className="text-primary underline underline-offset-2" onClick={() => setCodeMode(true)}>
                Already have a code?
              </button>
            </p>
          </>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-3 mb-3 max-w-xl">
              <input className={inputCls} type="email" placeholder="Email the code was sent to" value={codeEmail} onChange={(e) => setCodeEmail(e.target.value)} />
              <input className={inputCls} inputMode="numeric" placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            {error && <p className="text-sm text-[var(--color-down)] mb-3">{error}</p>}
            <div className="flex items-center gap-4">
              <Button onClick={submitCode} disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Checking…' : 'Unlock with code →'}
              </Button>
              <button className="text-sm text-primary underline underline-offset-2" onClick={() => setCodeMode(false)}>
                Back to contribute
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
