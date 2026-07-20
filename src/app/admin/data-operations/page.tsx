import type { Metadata } from 'next';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Database,
  FileClock,
  RefreshCw,
} from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Market Data Operations | Bloomforce',
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type DataRow = Record<string, unknown>;

const STATUSES = ['all', 'pending', 'review_required', 'accepted', 'rejected'] as const;
const SOURCES = ['all', 'survey', 'jotform', 'web_contribution'] as const;

function value(param: string | string[] | undefined): string {
  return Array.isArray(param) ? param[0] ?? '' : param ?? '';
}

function dateTime(input: unknown): string {
  if (!input) return 'Never';
  const date = new Date(String(input));
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function money(input: unknown): string {
  const amount = Number(input);
  if (!Number.isFinite(amount)) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function statusClass(status: unknown): string {
  switch (status) {
    case 'accepted':
    case 'ok':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'review_required':
    case 'running':
      return 'bg-amber-50 text-amber-900 border-amber-200';
    case 'rejected':
    case 'error':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

async function exactCount(
  table: string,
  filters: Array<[string, string | number | boolean]> = [],
): Promise<number> {
  let query = supabaseAdmin().from(table).select('*', { count: 'exact', head: true });
  for (const [column, filterValue] of filters) query = query.eq(column, filterValue);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function loadData(status: string, source: string) {
  const db = supabaseAdmin();
  let responsesQuery = db
    .from('survey_responses')
    .select(
      'id,submitted_at,source,instrument_key,status,role_family,role_key,seniority_level,region,work_model,employer_type,base_comp,is_baseline,baseline_cohort,rejection_reason,validation_notes',
    )
    .order('submitted_at', { ascending: false })
    .limit(100);
  if (status !== 'all') responsesQuery = responsesQuery.eq('status', status);
  if (source !== 'all') responsesQuery = responsesQuery.eq('source', source);

  const [
    responses,
    runs,
    rawRecent,
    freshness,
    baseline2024,
    baseline2025,
    acceptedContinuous,
    pending,
    review,
    rejected,
    posted,
    benchmarkCells,
  ] = await Promise.all([
    responsesQuery,
    db
      .from('ingest_runs')
      .select(
        'id,source,started_at,finished_at,status,rows_in,rows_upserted,rows_accepted,rows_review_required,rows_rejected,notes',
      )
      .order('started_at', { ascending: false })
      .limit(20),
    db
      .from('survey_submissions_raw')
      .select('id,instrument_key,processing_status,received_at,processed_at')
      .order('received_at', { ascending: false })
      .limit(300),
    db.from('freshness_published').select('*').eq('id', 1).maybeSingle(),
    exactCount('survey_responses', [['is_baseline', true], ['survey_year', 2024]]),
    exactCount('survey_responses', [['is_baseline', true], ['survey_year', 2025]]),
    exactCount('survey_responses', [['is_baseline', false], ['status', 'accepted']]),
    exactCount('survey_responses', [['status', 'pending']]),
    exactCount('survey_responses', [['status', 'review_required']]),
    exactCount('survey_responses', [['status', 'rejected']]),
    exactCount('comp_observations', [['observation_type', 'posted'], ['in_benchmark', true]]),
    exactCount('benchmark_published'),
  ]);

  for (const result of [responses, runs, rawRecent, freshness]) {
    if (result.error) throw result.error;
  }

  const rawRows = (rawRecent.data ?? []) as DataRow[];
  const instruments = new Map<string, { received: number; waiting: number; last: unknown }>();
  for (const row of rawRows) {
    const key = String(row.instrument_key ?? 'unknown');
    const item = instruments.get(key) ?? { received: 0, waiting: 0, last: row.received_at };
    item.received++;
    if (['received', 'review_required', 'error'].includes(String(row.processing_status))) item.waiting++;
    instruments.set(key, item);
  }

  return {
    responses: (responses.data ?? []) as DataRow[],
    runs: (runs.data ?? []) as DataRow[],
    freshness: (freshness.data ?? null) as DataRow | null,
    instruments: [...instruments.entries()],
    counts: { baseline2024, baseline2025, acceptedContinuous, pending, review, rejected, posted, benchmarkCells },
  };
}

export default async function DataOperationsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const requestedStatus = value(params.status);
  const requestedSource = value(params.source);
  const status = STATUSES.includes(requestedStatus as (typeof STATUSES)[number]) ? requestedStatus : 'all';
  const source = SOURCES.includes(requestedSource as (typeof SOURCES)[number]) ? requestedSource : 'all';

  try {
    const data = await loadData(status, source);
    const tiles = [
      ['2024 baseline', data.counts.baseline2024, 'Permanent'],
      ['2025 baseline', data.counts.baseline2025, 'Permanent'],
      ['Continuous accepted', data.counts.acceptedContinuous, 'Additive'],
      ['Active postings', data.counts.posted, 'Rolling window'],
      ['Needs review', data.counts.review, 'Action needed'],
      ['Published cuts', data.counts.benchmarkCells, 'Live'],
    ];

    return (
      <main className="min-h-screen bg-[#f6f8f8] text-[#152033]">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-5 lg:px-8">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-[#007f74]">
                <Database size={15} aria-hidden="true" /> Bloomforce Insights
              </div>
              <h1 className="text-2xl font-semibold lg:text-3xl">Market Data Operations</h1>
            </div>
            <div className="text-right text-sm text-slate-500">
              <div className="flex items-center justify-end gap-2 font-medium text-slate-700">
                <CircleDot size={14} className="text-emerald-600" aria-hidden="true" /> Published
              </div>
              <div>{dateTime(data.freshness?.as_of)}</div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] px-5 py-6 lg:px-8">
          <section className="grid grid-cols-2 border border-slate-200 bg-white md:grid-cols-3 xl:grid-cols-6">
            {tiles.map(([label, count, note], index) => (
              <div
                key={String(label)}
                className={`min-w-0 p-4 ${index % 2 ? '' : 'border-r'} border-b border-slate-200 md:border-r xl:border-b-0`}
              >
                <div className="truncate text-xs font-semibold uppercase text-slate-500">{label}</div>
                <div className="mt-2 text-2xl font-semibold tabular-nums">{String(count)}</div>
                <div className="mt-1 text-xs text-slate-500">{note}</div>
              </div>
            ))}
          </section>

          <section className="mt-6 border border-slate-200 bg-white">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Survey records</h2>
                <p className="mt-1 text-sm text-slate-500">Latest 100 records matching the selected view</p>
              </div>
              <form className="flex flex-wrap items-center gap-2" method="get">
                <label className="sr-only" htmlFor="status">Status</label>
                <select id="status" name="status" defaultValue={status} className="h-9 border border-slate-300 bg-white px-3 text-sm">
                  {STATUSES.map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}
                </select>
                <label className="sr-only" htmlFor="source">Source</label>
                <select id="source" name="source" defaultValue={source} className="h-9 border border-slate-300 bg-white px-3 text-sm">
                  {SOURCES.map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}
                </select>
                <button className="inline-flex h-9 items-center gap-2 bg-[#152033] px-4 text-sm font-semibold text-white" type="submit">
                  <RefreshCw size={14} aria-hidden="true" /> Apply
                </button>
              </form>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    {['Status', 'Submitted', 'Source', 'Role', 'Level', 'Region', 'Work model', 'Employer', 'Base salary', 'Reason'].map((heading) => (
                      <th key={heading} className="border-b border-slate-200 px-4 py-3 font-semibold">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.responses.map((row) => (
                    <tr key={String(row.id)} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                      <td className="px-4 py-3"><span className={`inline-flex border px-2 py-1 text-xs font-semibold ${statusClass(row.status)}`}>{String(row.status)}</span></td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{dateTime(row.submitted_at)}</td>
                      <td className="px-4 py-3"><div className="font-medium">{String(row.source ?? '-')}</div><div className="max-w-44 truncate text-xs text-slate-500">{String(row.instrument_key ?? row.baseline_cohort ?? '')}</div></td>
                      <td className="px-4 py-3 font-medium">{String(row.role_key ?? row.role_family ?? '-')}</td>
                      <td className="px-4 py-3">{String(row.seniority_level ?? '-')}</td>
                      <td className="px-4 py-3">{String(row.region ?? 'National only')}</td>
                      <td className="px-4 py-3 capitalize">{String(row.work_model ?? '-')}</td>
                      <td className="px-4 py-3">{String(row.employer_type ?? '-').replaceAll('_', ' ')}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums">{money(row.base_comp)}</td>
                      <td className="max-w-64 px-4 py-3 text-xs text-slate-600">{String(row.rejection_reason ?? (Array.isArray(row.validation_notes) ? row.validation_notes.join('; ') : '') ?? '') || '-'}</td>
                    </tr>
                  ))}
                  {!data.responses.length && (
                    <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-500">No records match these filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.4fr]">
            <section className="border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-4">
                <h2 className="text-lg font-semibold">Survey source status</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {data.instruments.map(([key, item]) => (
                  <div key={key} className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3 text-sm">
                    <div className="min-w-0"><div className="truncate font-medium">{key.replaceAll('_', ' ')}</div><div className="text-xs text-slate-500">Last received {dateTime(item.last)}</div></div>
                    <div className="text-right"><div className="font-semibold tabular-nums">{item.received}</div><div className={item.waiting ? 'text-xs text-amber-700' : 'text-xs text-slate-500'}>{item.waiting} waiting</div></div>
                  </div>
                ))}
                {!data.instruments.length && <div className="px-4 py-8 text-sm text-slate-500">No webhook submissions received.</div>}
              </div>
            </section>

            <section className="border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-4">
                <h2 className="text-lg font-semibold">Recent processing runs</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Run</th><th className="px-4 py-3">Started</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">In</th><th className="px-4 py-3 text-right">Accepted</th><th className="px-4 py-3 text-right">Review</th><th className="px-4 py-3 text-right">Rejected</th></tr></thead>
                  <tbody>
                    {data.runs.map((run) => (
                      <tr key={String(run.id)} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-medium">{String(run.source)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{dateTime(run.started_at)}</td>
                        <td className="px-4 py-3"><span className={`inline-flex border px-2 py-1 text-xs font-semibold ${statusClass(run.status)}`}>{String(run.status)}</span></td>
                        <td className="px-4 py-3 text-right tabular-nums">{String(run.rows_in ?? '-')}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{String(run.rows_accepted ?? run.rows_upserted ?? '-')}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{String(run.rows_review_required ?? '-')}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{String(run.rows_rejected ?? '-')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-600" aria-hidden="true" /> Accepted continuous: {data.counts.acceptedContinuous}</span>
            <span className="inline-flex items-center gap-2"><FileClock size={15} className="text-slate-500" aria-hidden="true" /> Pending: {data.counts.pending}</span>
            <span className="inline-flex items-center gap-2"><AlertTriangle size={15} className="text-amber-600" aria-hidden="true" /> Review: {data.counts.review}</span>
            <span className="text-slate-400">Rejected: {data.counts.rejected}</span>
          </section>
        </div>
      </main>
    );
  } catch (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8f8] p-6">
        <section className="w-full max-w-xl border border-rose-200 bg-white p-6">
          <div className="flex items-center gap-2 font-semibold text-rose-800"><AlertTriangle size={18} /> Market Data Operations is unavailable</div>
          <p className="mt-3 text-sm text-slate-600">{error instanceof Error ? error.message : 'Unable to load market data.'}</p>
        </section>
      </main>
    );
  }
}
