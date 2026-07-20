'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, Search, Sparkles } from 'lucide-react';
import { EMPLOYER_TYPES } from '@/lib/insights/organization-classification';

export interface OrganizationQueueRow {
  id: string;
  rawName: string;
  occurrences: number;
  candidateName: string | null;
  employerType: string | null;
  confidence: number;
  method: 'bloomos_alias' | 'rule' | 'review';
  signal: string;
}

function labelize(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function OrganizationMatchingTable({ rows }: { rows: OrganizationQueueRow[] }) {
  const [items, setItems] = useState(rows);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkType, setBulkType] = useState('');
  const filtered = useMemo(
    () => items.filter((item) => `${item.rawName} ${item.candidateName ?? ''}`.toLowerCase().includes(query.toLowerCase())),
    [items, query],
  );

  function approve(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    setSelected((current) => current.filter((item) => item !== id));
  }

  function applyBulk() {
    if (!bulkType || !selected.length) return;
    setItems((current) => current.filter((item) => !selected.includes(item.id)));
    setSelected([]);
    setBulkType('');
  }

  return (
    <section className="border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Organization review queue</h2>
          <p className="mt-1 text-sm text-slate-500">Approve a BloomOS match, confirm the organization type, and save the name as an alias.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative">
            <span className="sr-only">Search organizations</span>
            <Search className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={15} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search organizations" className="h-9 w-full border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-[#00a896] sm:w-56" />
          </label>
          <div className="flex">
            <label className="relative min-w-0 flex-1 sm:w-48">
              <span className="sr-only">Bulk organization type</span>
              <select value={bulkType} onChange={(event) => setBulkType(event.target.value)} className="h-9 w-full appearance-none border border-r-0 border-slate-300 bg-white px-3 pr-8 text-sm">
                <option value="">Set organization type</option>
                {EMPLOYER_TYPES.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 text-slate-400" size={14} />
            </label>
            <button type="button" onClick={applyBulk} disabled={!bulkType || !selected.length} className="h-9 bg-[#152033] px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Apply ({selected.length})</button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
            <tr>
              <th className="w-11 border-b border-slate-200 px-4 py-3"><span className="sr-only">Select</span></th>
              <th className="border-b border-slate-200 px-4 py-3 font-semibold">Scraped name</th>
              <th className="border-b border-slate-200 px-4 py-3 font-semibold">BloomOS account</th>
              <th className="border-b border-slate-200 px-4 py-3 font-semibold">Organization type</th>
              <th className="border-b border-slate-200 px-4 py-3 font-semibold">Match</th>
              <th className="border-b border-slate-200 px-4 py-3 font-semibold">Reason</th>
              <th className="border-b border-slate-200 px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70">
                <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(row.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, row.id] : current.filter((id) => id !== row.id))} aria-label={`Select ${row.rawName}`} /></td>
                <td className="px-4 py-3"><div className="font-medium text-slate-950">{row.rawName}</div><div className="mt-0.5 text-xs text-slate-500">{row.occurrences} postings</div></td>
                <td className="px-4 py-3"><div className="font-medium">{row.candidateName ?? 'No account match'}</div><div className="mt-0.5 text-xs text-slate-500">{row.method === 'bloomos_alias' ? 'Existing account or alias' : 'Search BloomOS to confirm'}</div></td>
                <td className="px-4 py-3"><select defaultValue={row.employerType ?? ''} className="h-8 w-52 border border-slate-300 bg-white px-2 text-xs"><option value="">Choose type</option>{EMPLOYER_TYPES.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}</select></td>
                <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 border px-2 py-1 text-xs font-semibold ${row.confidence >= 0.9 ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : row.confidence > 0 ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>{row.method === 'rule' && <Sparkles size={11} />}{row.confidence ? `${Math.round(row.confidence * 100)}%` : 'Review'}</span></td>
                <td className="max-w-72 px-4 py-3 text-xs text-slate-600">{row.signal}</td>
                <td className="px-4 py-3 text-right"><button type="button" onClick={() => approve(row.id)} className="inline-flex h-8 items-center gap-1.5 bg-[#007f74] px-3 text-xs font-semibold text-white hover:bg-[#006c63]"><Check size={13} /> Approve</button></td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={7} className="px-4 py-14 text-center text-sm text-slate-500">No organizations match this view.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
