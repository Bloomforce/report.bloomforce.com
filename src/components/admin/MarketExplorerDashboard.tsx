'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CircleGauge,
  Home,
  Laptop,
  Minus,
  SlidersHorizontal,
} from 'lucide-react';
import type { BenchmarkRow, InsightsData, Seniority, WorkModel } from '@/lib/insights/types';
import { cn } from '@/lib/utils';

const SENIORITY_LABELS: Record<string, string> = {
  ALL: 'All levels',
  L1: 'Early career',
  L2: 'Experienced',
  L3: 'Senior',
  L4: 'Lead / principal',
  M1: 'Manager',
  M2: 'Director',
  M3: 'VP',
  exec: 'Executive',
};

const ORG_LABELS: Record<string, string> = {
  all: 'All organization types',
  academic: 'Academic medical center',
  academic_medical_center: 'Academic medical center',
  childrens: "Children's hospital",
  childrens_hospital: "Children's hospital",
  independent: 'Independent hospital',
  independent_hospital: 'Independent hospital',
  multi_state_system: 'Multi-state health system',
  single_state_system: 'Regional health system',
  payer: 'Health plan / payer',
  consulting: 'Consulting / services',
  vendor: 'Vendor / technology',
  government: 'Government / public',
  consulting_msp: 'Consulting / MSP',
  other: 'Other',
};

const WORK_LABELS: Record<string, string> = {
  all: 'All work models',
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
};

const MODULE_LABELS: Record<string, string> = {
  all: 'All Epic modules',
  ambulatory: 'Ambulatory', beaker: 'Beaker / Laboratory', bridges: 'Bridges / Interfaces',
  cadence: 'Cadence / Scheduling', clindoc: 'ClinDoc / Clinical Documentation', cogito: 'Cogito / Analytics',
  compass_rose: 'Compass Rose / Care Management', cupid: 'Cupid / Cardiology', healthy_planet: 'Healthy Planet / Population Health',
  him: 'HIM / Coding', mychart: 'MyChart / Patient Portal', optime: 'OpTime / Surgical', radiant: 'Radiant / Radiology',
  resolute_hb: 'Resolute Hospital Billing', resolute_pb: 'Resolute Professional Billing', tapestry: 'Tapestry / Managed Care',
  willow: 'Willow / Pharmacy',
};

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatK(value: number): string {
  return `$${Math.round(value / 1000)}k`;
}

function labelize(value: string): string {
  return ORG_LABELS[value] ?? value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function MiniSparkline({ values }: { values: number[] }) {
  const width = 360;
  const height = 82;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  const points = values
    .map((value, index) => `${(index / Math.max(values.length - 1, 1)) * width},${height - ((value - min) / span) * (height - 14) - 7}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[82px] w-full" role="img" aria-label="12 month salary trend">
      <defs>
        <linearGradient id="salary-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3bc3b4" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#3bc3b4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${width},${height}`} fill="url(#salary-area)" />
      <polyline points={points} fill="none" stroke="#3bc3b4" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Delta({ value, suffix = '' }: { value: number | null; suffix?: string }) {
  if (value === null || value === 0) {
    return <span className="inline-flex items-center gap-1 text-xs text-white/45"><Minus size={12} /> no change</span>;
  }
  const up = value > 0;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', up ? 'text-[#3bc3b4]' : 'text-[#ff6f85]')}>
      {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {suffix === '$' ? formatK(Math.abs(value)) : `${Math.round(Math.abs(value) * 100)}${suffix}`} · 90d
    </span>
  );
}

function DarkPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn('border border-white/10 bg-white/[0.035] p-5 sm:p-6', className)}>{children}</section>;
}

export function MarketExplorerDashboard({ data }: { data: InsightsData }) {
  const defaultRole = data.roles.find((role) => role.roleKey === 'AA')?.roleKey ?? data.roles[0]?.roleKey ?? 'AA';
  const [role, setRole] = useState(defaultRole);
  const [seniority, setSeniority] = useState<Seniority | 'ALL'>('ALL');
  const [region, setRegion] = useState('National');
  const [workModel, setWorkModel] = useState<WorkModel | 'all'>('all');
  const [employerType, setEmployerType] = useState('all');
  const [module, setModule] = useState('all');

  const roleRows = useMemo(() => data.benchmarks.filter((row) => row.roleFamily === role), [data.benchmarks, role]);
  const moduleOptions = useMemo(
    () => ['all', ...new Set(roleRows.filter((row) => row.module !== 'all' && row.seniority === 'ALL' && row.region === 'National' && row.workModel === 'all' && row.employerType === 'all').map((row) => row.module))]
      .sort((a, b) => a === 'all' ? -1 : b === 'all' ? 1 : (MODULE_LABELS[a] ?? labelize(a)).localeCompare(MODULE_LABELS[b] ?? labelize(b))),
    [roleRows],
  );
  const moduleRows = useMemo(() => roleRows.filter((row) => row.module === module), [module, roleRows]);
  const roleName = data.roles.find((item) => item.roleKey === role)?.label ?? role;
  const levels = useMemo(
    () => ['ALL', ...new Set(moduleRows.filter((row) => row.seniority !== 'ALL').map((row) => row.seniority))] as (Seniority | 'ALL')[],
    [moduleRows],
  );
  const employerTypes = useMemo(
    () => ['all', ...new Set(moduleRows.filter((row) => row.employerType !== 'all').map((row) => row.employerType))],
    [moduleRows],
  );

  const selected = moduleRows.find(
    (row) =>
      row.seniority === seniority &&
      row.region === region &&
      row.workModel === workModel &&
      row.employerType === employerType,
  );
  const national = moduleRows.find(
    (row) => row.seniority === 'ALL' && row.region === 'National' && row.workModel === 'all' && row.employerType === 'all',
  );
  const current = selected ?? national;
  const workCuts = moduleRows.filter(
    (row) => row.seniority === 'ALL' && row.region === 'National' && row.workModel !== 'all' && row.employerType === 'all',
  );
  const orgCuts = moduleRows
    .filter((row) => row.seniority === 'ALL' && row.region === 'National' && row.workModel === 'all' && row.employerType !== 'all')
    .sort((a, b) => b.blended.p50 - a.blended.p50);
  const maxOrgMedian = Math.max(...orgCuts.map((row) => row.blended.p50), 1);
  const totalWorkN = workCuts.reduce((sum, row) => sum + row.n, 0);
  const updated = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(data.freshness.asOf),
  );

  function chooseSeniority(value: Seniority | 'ALL') {
    setSeniority(value);
    if (value !== 'ALL') {
      setWorkModel('all');
      setEmployerType('all');
    }
  }

  function chooseModule(value: string) {
    setModule(value);
    setSeniority('ALL');
    setRegion('National');
    setWorkModel('all');
    setEmployerType('all');
  }

  function chooseRegion(value: string) {
    setRegion(value);
    if (value !== 'National') {
      setWorkModel('all');
      setEmployerType('all');
    }
  }

  function chooseWorkModel(value: WorkModel | 'all') {
    setWorkModel(value);
    if (value !== 'all') {
      setSeniority('ALL');
      setRegion('National');
      setEmployerType('all');
    }
  }

  function chooseEmployerType(value: string) {
    setEmployerType(value);
    if (value !== 'all') {
      setSeniority('ALL');
      setRegion('National');
      setWorkModel('all');
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-7">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-[#007f74]">
            <CircleGauge size={14} aria-hidden="true" /> Market in Motion
          </div>
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">Market Explorer</h1>
          <p className="mt-1 text-sm text-slate-500">Salary, demand, and workforce signals in one working view.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <CalendarClock size={14} aria-hidden="true" /> Updated {updated} · {data.freshness.windowLabel}
        </div>
      </div>

      <section className="mb-4 border border-slate-200 bg-white p-3" aria-label="Market filters">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500 sm:hidden">
          <SlidersHorizontal size={14} aria-hidden="true" /> Filters
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
          <Filter label="Role" value={role} onChange={(value) => { setRole(value); setModule('all'); setSeniority('ALL'); setRegion('National'); setWorkModel('all'); setEmployerType('all'); }}>
            {data.roles.map((item) => <option key={item.roleKey} value={item.roleKey}>{item.label}</option>)}
          </Filter>
          <Filter label="Epic module" value={module} onChange={chooseModule}>
            {moduleOptions.map((item) => <option key={item} value={item}>{MODULE_LABELS[item] ?? labelize(item)}</option>)}
          </Filter>
          <Filter label="Level" value={seniority} onChange={(value) => chooseSeniority(value as Seniority | 'ALL')}>
            {levels.map((item) => <option key={item} value={item}>{SENIORITY_LABELS[item] ?? item}</option>)}
          </Filter>
          <Filter label="Region" value={region} onChange={chooseRegion}>
            {data.regions.map((item) => <option key={item} value={item}>{item}</option>)}
          </Filter>
          <Filter label="Work model" value={workModel} onChange={(value) => chooseWorkModel(value as WorkModel | 'all')}>
            {(['all', 'remote', 'hybrid', 'onsite'] as const).map((item) => <option key={item} value={item}>{WORK_LABELS[item]}</option>)}
          </Filter>
          <Filter label="Organization type" value={employerType} onChange={chooseEmployerType}>
            {employerTypes.map((item) => <option key={item} value={item}>{labelize(item)}</option>)}
          </Filter>
        </div>
        {module !== 'all' && <p className="mt-2 text-[11px] text-slate-500">Module cuts currently rely primarily on advertised salary ranges. Accepted survey responses are blended in as the sample grows.</p>}
      </section>

      <div className="overflow-hidden border border-[#1f2c3d] bg-[#0f1724] text-white shadow-[0_18px_50px_rgba(15,23,36,0.16)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/10 px-5 py-3.5">
          <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase text-[#3bc3b4]">
            <span className="h-2 w-2 bg-[#3bc3b4] shadow-[0_0_0_5px_rgba(59,195,180,0.12)]" />
            Bloomforce Market in Motion&trade;
          </span>
          <span className="ml-auto font-mono text-[10px] uppercase text-white/40">
            {selected ? 'selected published cut' : 'broadest available cut'} · {current?.confidenceTier ?? 'unavailable'}
          </span>
        </div>

        <div className="grid gap-4 p-4 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="grid gap-4">
            <DarkPanel>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{roleName}</h2>
                  <p className="mt-1 text-xs text-white/45">
                    {MODULE_LABELS[module] ?? labelize(module)} · {employerType !== 'all' ? labelize(employerType) : region} · {SENIORITY_LABELS[seniority]} · {WORK_LABELS[workModel]}
                  </p>
                </div>
                <span className="border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[10px] uppercase text-white/50">
                  n={current?.n ?? 0}
                </span>
              </div>

              {current ? (
                <>
                  <div className="mt-5 grid items-end gap-5 lg:grid-cols-[0.7fr_1.3fr]">
                    <div>
                      <div className="text-[10px] font-semibold uppercase text-white/45">Benchmark median</div>
                      <div className="mt-1 font-mono text-4xl font-semibold tabular-nums sm:text-5xl">{formatK(current.blended.p50)}</div>
                      <div className="mt-2"><Delta value={current.medianDelta90d} suffix="$" /></div>
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] font-semibold uppercase text-white/45">Advertised pay · 12 months</div>
                      <MiniSparkline values={current.spark?.length ? current.spark : [current.blended.p25, current.blended.p50, current.blended.p75]} />
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="mb-2 flex justify-between text-[10px] font-mono uppercase text-white/40">
                      <span>P10 {formatK(current.blended.p10)}</span>
                      <span>P90 {formatK(current.blended.p90)}</span>
                    </div>
                    <div className="relative h-2 bg-white/10">
                      <div
                        className="absolute top-0 h-2 bg-[#3bc3b4]/55"
                        style={{
                          left: `${((current.blended.p25 - current.blended.p10) / Math.max(current.blended.p90 - current.blended.p10, 1)) * 100}%`,
                          right: `${100 - ((current.blended.p75 - current.blended.p10) / Math.max(current.blended.p90 - current.blended.p10, 1)) * 100}%`,
                        }}
                      />
                      <span
                        className="absolute top-[-4px] h-4 w-0.5 bg-white"
                        style={{ left: `${((current.blended.p50 - current.blended.p10) / Math.max(current.blended.p90 - current.blended.p10, 1)) * 100}%` }}
                      />
                    </div>
                    <div className="mt-2 flex justify-center text-xs text-white/60">Middle 50%: {formatMoney(current.blended.p25)}–{formatMoney(current.blended.p75)}</div>
                  </div>
                </>
              ) : (
                <div className="mt-6 border border-amber-400/20 bg-amber-400/5 p-5 text-sm text-white/65">
                  This combination does not yet meet the sample threshold. The national benchmark is shown in its place.
                </div>
              )}

              {!!workCuts.length && (
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {(['remote', 'hybrid', 'onsite'] as WorkModel[]).map((model) => {
                    const cut = workCuts.find((row) => row.workModel === model);
                    const Icon = model === 'remote' ? Laptop : model === 'hybrid' ? Home : Building2;
                    return (
                      <button
                        key={model}
                        type="button"
                        onClick={() => chooseWorkModel(model)}
                        className={cn(
                          'min-h-28 border p-3 text-center transition-colors',
                          workModel === model ? 'border-[#3bc3b4] bg-[#3bc3b4]/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]',
                        )}
                      >
                        <Icon className="mx-auto mb-2 text-[#3bc3b4]" size={17} aria-hidden="true" />
                        <div className="font-mono text-lg font-semibold">{cut ? formatK(cut.blended.p50) : '—'}</div>
                        <div className="mt-1 text-xs text-white/55">{WORK_LABELS[model]}</div>
                        <div className="mt-1 text-[10px] text-white/35">{cut ? `${cut.n} records` : 'No cut yet'}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </DarkPanel>

            <div className="grid gap-4 lg:grid-cols-2">
              <DarkPanel>
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Where demand sits</h2>
                    <p className="mt-1 text-xs text-white/40">Share of open EHR and IT roles</p>
                  </div>
                  <BriefcaseBusiness size={17} className="text-[#3bc3b4]" aria-hidden="true" />
                </div>
                <div className="space-y-4">
                  {data.demand.slice(0, 7).map((item) => (
                    <button key={item.key} type="button" onClick={() => data.roles.some((r) => r.roleKey === item.key) && setRole(item.key)} className="grid w-full grid-cols-[minmax(105px,0.8fr)_1fr_auto] items-center gap-3 text-left">
                      <span className={cn('truncate text-xs', item.key === role ? 'font-semibold text-[#3bc3b4]' : 'text-white/70')}>{item.label}</span>
                      <span className="h-2 bg-white/[0.08]"><span className="block h-full bg-[#3bc3b4]/70" style={{ width: `${Math.max(item.share * 100, 3)}%` }} /></span>
                      <span className="w-10 text-right font-mono text-xs text-white">{Math.round(item.share * 100)}%</span>
                    </button>
                  ))}
                </div>
              </DarkPanel>

              <DarkPanel>
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Pay by organization type</h2>
                    <p className="mt-1 text-xs text-white/40">Published cuts for {roleName}</p>
                  </div>
                  <Building2 size={17} className="text-[#3bc3b4]" aria-hidden="true" />
                </div>
                {orgCuts.length ? (
                  <div className="space-y-3.5">
                    {orgCuts.slice(0, 7).map((row) => (
                      <button key={row.employerType} type="button" onClick={() => chooseEmployerType(row.employerType)} className="grid w-full grid-cols-[minmax(120px,1fr)_1fr_auto] items-center gap-3 text-left">
                        <span className={cn('truncate text-xs', employerType === row.employerType ? 'font-semibold text-[#3bc3b4]' : 'text-white/70')}>{labelize(row.employerType)}</span>
                        <span className="h-2 bg-white/[0.08]"><span className="block h-full bg-[#3bc3b4]/70" style={{ width: `${(row.blended.p50 / maxOrgMedian) * 100}%` }} /></span>
                        <span className="text-right"><span className="block font-mono text-xs">{formatK(row.blended.p50)}</span><span className="block text-[9px] text-white/35">n={row.n}</span></span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-white/15 p-5 text-sm text-white/50">Organization-type samples are still being classified for this role.</div>
                )}
              </DarkPanel>
            </div>
          </div>

          <DarkPanel className="min-h-[420px]">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Market pulse</h2>
                <p className="mt-1 text-xs text-white/40">Recent changes worth watching</p>
              </div>
              <span className="font-mono text-[10px] uppercase text-white/35">Weekly</span>
            </div>
            <div className="divide-y divide-white/10">
              {data.pulse.slice(0, 7).map((item) => (
                <article key={item.id} className="py-5 first:pt-4">
                  <div className="flex gap-3">
                    <ArrowUp size={16} className="mt-0.5 shrink-0 text-[#3bc3b4]" aria-hidden="true" />
                    <div>
                      <p className="text-sm leading-6 text-white/80">{item.text}</p>
                      <div className="mt-2 flex items-center gap-3 font-mono text-[10px] uppercase text-white/35">
                        <span>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(item.ts))}</span>
                        {item.deltaValue !== undefined && <span className={item.deltaValue >= 0 ? 'text-[#3bc3b4]' : 'text-[#ff6f85]'}>{item.deltaValue >= 0 ? '+' : ''}{item.deltaUnit === '$' ? formatK(item.deltaValue) : `${item.deltaValue}${item.deltaUnit ?? ''}`}</span>}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-white/40">
              Based on {data.freshness.totalRespondents.toLocaleString()} verified survey responses and {data.freshness.postingsIngested.toLocaleString()} ingested job postings.
            </div>
          </DarkPanel>
        </div>
      </div>

      <section className="mt-4 grid border border-slate-200 bg-white sm:grid-cols-3">
        <CoverageStat label="Selected sample" value={(current?.n ?? 0).toLocaleString()} detail={current?.confidenceTier ?? 'No published cut'} />
        <CoverageStat label="Work model coverage" value={totalWorkN.toLocaleString()} detail={`${workCuts.length} published cuts`} />
        <CoverageStat label="Organization coverage" value={orgCuts.reduce((sum, row) => sum + row.n, 0).toLocaleString()} detail={`${orgCuts.length} categorized cuts`} />
      </section>
    </main>
  );
}

function Filter({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#00a896] focus:ring-2 focus:ring-[#00a896]/15">
        {children}
      </select>
    </label>
  );
}

function CoverageStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border-b border-slate-200 p-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <div className="text-[10px] font-semibold uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums text-slate-950">{value}</div>
      <div className="mt-1 text-xs capitalize text-slate-500">{detail}</div>
    </div>
  );
}
