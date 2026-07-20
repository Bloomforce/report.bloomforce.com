'use client';

import { useState } from 'react';
import { ArrowLeft, Braces, CheckCircle2, FileSpreadsheet, Link2, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type IntakeMode = 'csv' | 'api' | 'webhook';

const MODES = [
  { id: 'csv' as const, label: 'Upload CSV', description: 'Survey exports, public records, or job data', icon: FileSpreadsheet },
  { id: 'api' as const, label: 'Connect API', description: 'Scheduled pull from a source system', icon: Braces },
  { id: 'webhook' as const, label: 'Receive webhook', description: 'Continuous intake from a form or app', icon: Link2 },
];

export function DataIntakeWorkspace() {
  const [mode, setMode] = useState<IntakeMode>('csv');
  const [fileName, setFileName] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  return (
    <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7">
      <Link href="/admin/data-operations" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"><ArrowLeft size={15} /> Data Operations</Link>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">Add a data source</h1>
        <p className="mt-1 text-sm text-slate-500">Land new data in staging first. Nothing reaches the benchmark until validation and review are complete.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <nav className="border border-slate-200 bg-white p-2" aria-label="Data source type">
          {MODES.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" onClick={() => { setMode(item.id); setConfirmed(false); }} className={cn('mb-1 flex w-full items-start gap-3 border p-3 text-left last:mb-0', mode === item.id ? 'border-[#00a896] bg-[#edf9f7]' : 'border-transparent hover:bg-slate-50')}>
                <Icon size={18} className={mode === item.id ? 'text-[#007f74]' : 'text-slate-400'} aria-hidden="true" />
                <span><span className="block text-sm font-semibold text-slate-950">{item.label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</span></span>
              </button>
            );
          })}
        </nav>

        <section className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <div className="text-[10px] font-semibold uppercase text-[#007f74]">{MODES.find((item) => item.id === mode)?.label}</div>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">{mode === 'csv' ? 'Prepare the import' : mode === 'api' ? 'Set up the connection' : 'Create an intake endpoint'}</h2>
          </div>

          <div className="p-5">
            {mode === 'csv' && (
              <div className="space-y-5">
                <Field label="Source name"><input value={sourceName} onChange={(event) => setSourceName(event.target.value)} placeholder="Example: 2026 salary survey export" className="h-10 w-full border border-slate-300 px-3 text-sm outline-none focus:border-[#00a896]" /></Field>
                <Field label="Data type"><select className="h-10 w-full border border-slate-300 bg-white px-3 text-sm"><option>Salary survey</option><option>Job postings</option><option>Public salary records</option><option>Organization reference data</option></select></Field>
                <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center border border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-[#00a896] hover:bg-[#edf9f7]">
                  <UploadCloud size={25} className="text-[#007f74]" aria-hidden="true" />
                  <span className="mt-3 text-sm font-semibold text-slate-950">{fileName || 'Choose a CSV file'}</span>
                  <span className="mt-1 text-xs text-slate-500">The next step maps columns and previews validation results.</span>
                  <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')} />
                </label>
              </div>
            )}

            {mode === 'api' && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Connection name"><input placeholder="BloomOS accounts" className="h-10 w-full border border-slate-300 px-3 text-sm" /></Field>
                <Field label="Authentication"><select className="h-10 w-full border border-slate-300 bg-white px-3 text-sm"><option>Bearer token</option><option>API key</option><option>OAuth 2.0</option><option>Basic auth</option></select></Field>
                <div className="sm:col-span-2"><Field label="Endpoint"><input placeholder="https://api.example.com/v1/accounts" className="h-10 w-full border border-slate-300 px-3 font-mono text-xs" /></Field></div>
                <Field label="Sync cadence"><select className="h-10 w-full border border-slate-300 bg-white px-3 text-sm"><option>Daily</option><option>Weekly</option><option>Monthly</option><option>Manual</option></select></Field>
                <Field label="Data type"><select className="h-10 w-full border border-slate-300 bg-white px-3 text-sm"><option>Organizations and aliases</option><option>Job postings</option><option>Salary observations</option></select></Field>
              </div>
            )}

            {mode === 'webhook' && (
              <div className="space-y-5">
                <Field label="Source name"><input placeholder="2026 salary survey" className="h-10 w-full border border-slate-300 px-3 text-sm" /></Field>
                <Field label="Instrument"><select className="h-10 w-full border border-slate-300 bg-white px-3 text-sm"><option>Salary survey response</option><option>Benchmark contribution</option><option>Job posting</option></select></Field>
                <div className="border border-slate-200 bg-slate-50 p-4"><div className="text-[10px] font-semibold uppercase text-slate-500">Endpoint created after save</div><code className="mt-2 block break-all text-xs text-slate-700">https://report.bloomforce.com/api/intake/[source-key]</code></div>
              </div>
            )}

            {confirmed ? (
              <div className="mt-6 flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><CheckCircle2 size={18} className="mt-0.5 shrink-0" /><div><div className="font-semibold">Source draft is ready</div><div className="mt-1 text-emerald-800">This v1 keeps the connection in preview until its mapping and validation rules are approved.</div></div></div>
            ) : (
              <div className="mt-6 flex justify-end border-t border-slate-200 pt-5"><button type="button" onClick={() => setConfirmed(true)} disabled={mode === 'csv' && (!fileName || !sourceName)} className="h-10 bg-[#152033] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Continue to mapping</button></div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>{children}</label>;
}
