import type { Metadata } from 'next';
import { ArrowRight, BookOpenCheck, GitMerge, ScanSearch } from 'lucide-react';
import { OrganizationMatchingTable, type OrganizationQueueRow } from '@/components/admin/OrganizationMatchingTable';
import { classifyOrganization } from '@/lib/insights/organization-classification';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Organization Matching | Bloomforce',
  robots: { index: false, follow: false },
};

const FALLBACK_NAMES = [
  ['UTMB Health', 18],
  ['University of Texas Medical Branch', 9],
  ["Children's Hospital Network", 7],
  ['Regional Health Partners', 6],
  ['State Department of Public Health', 4],
] as const;

function previewQueue(): { rows: OrganizationQueueRow[]; totalNames: number; categorized: number } {
  const rows = FALLBACK_NAMES.map(([name, occurrences], index) => {
    const classification = classifyOrganization(name);
    return {
      id: `preview-${index}`,
      rawName: name,
      occurrences,
      candidateName: name === 'UTMB Health' ? 'University of Texas Medical Branch' : classification.canonicalName,
      employerType: name === 'UTMB Health' ? 'academic_medical_center' : classification.employerType,
      confidence: name === 'UTMB Health' ? 0.94 : classification.confidence,
      method: name === 'UTMB Health' ? 'bloomos_alias' as const : classification.method,
      signal: name === 'UTMB Health' ? 'Matched a proposed BloomOS alias' : classification.signals[0],
    };
  });
  return { rows, totalNames: rows.length, categorized: rows.filter((row) => row.employerType).length };
}

async function loadQueue(): Promise<{ rows: OrganizationQueueRow[]; totalNames: number; categorized: number }> {
  try {
    const { data, error } = await supabaseAdmin()
      .from('raw_jobs')
      .select('company')
      .not('company', 'is', null)
      .limit(5000);
    if (error) throw error;
    const counts = new Map<string, number>();
    for (const item of data ?? []) {
      const company = String(item.company ?? '').trim();
      if (company) counts.set(company, (counts.get(company) ?? 0) + 1);
    }
    if (!counts.size) return previewQueue();
    const classified = [...counts.entries()]
      .map(([name, occurrences]) => ({ classification: classifyOrganization(name), occurrences }))
      .sort((a, b) => b.occurrences - a.occurrences);
    return {
      rows: classified.slice(0, 40).map(({ classification, occurrences }, index) => ({
        id: `${classification.normalizedName}-${index}`,
        rawName: classification.rawName,
        occurrences,
        candidateName: classification.canonicalName,
        employerType: classification.employerType,
        confidence: classification.confidence,
        method: classification.method,
        signal: classification.signals[0],
      })),
      totalNames: classified.length,
      categorized: classified.filter(({ classification }) => classification.employerType).length,
    };
  } catch {
    return previewQueue();
  }
}

export default async function OrganizationMatchingPage() {
  const data = await loadQueue();
  const coverage = data.totalNames ? Math.round((data.categorized / data.totalNames) * 100) : 0;

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 sm:py-7">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-[#007f74]"><GitMerge size={14} /> Data Operations</div>
          <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">Organization matching</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">Resolve scraped employer names to BloomOS accounts, assign a durable organization type, and reuse every approved alias.</p>
        </div>
        <div className="grid grid-cols-3 border border-slate-200 bg-white text-center">
          <Metric label="Names" value={data.totalNames.toLocaleString()} />
          <Metric label="Categorized" value={data.categorized.toLocaleString()} />
          <Metric label="Coverage" value={`${coverage}%`} />
        </div>
      </div>

      <section className="mb-5 grid border border-slate-200 bg-white lg:grid-cols-3">
        <FlowStep icon={ScanSearch} number="01" title="Match BloomOS" copy="Normalize the scraped name, then match account names, domains, and approved aliases." />
        <FlowStep icon={BookOpenCheck} number="02" title="Apply known rules" copy="Use high-confidence name and domain signals only when no verified account match exists." />
        <FlowStep icon={GitMerge} number="03" title="Review once" copy="Confirm the account and type, add the alias, and automatically enrich future postings." last />
      </section>

      <OrganizationMatchingTable rows={data.rows} />
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="min-w-24 border-r border-slate-200 px-4 py-3 last:border-r-0"><div className="text-[10px] font-semibold uppercase text-slate-500">{label}</div><div className="mt-1 text-lg font-semibold tabular-nums text-slate-950">{value}</div></div>;
}

function FlowStep({ icon: Icon, number, title, copy, last = false }: { icon: typeof ScanSearch; number: string; title: string; copy: string; last?: boolean }) {
  return (
    <div className="relative border-b border-slate-200 p-4 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#edf9f7] text-[#007f74]"><Icon size={18} aria-hidden="true" /></span>
        <div><div className="text-[10px] font-semibold uppercase text-slate-400">Step {number}</div><h2 className="mt-0.5 text-sm font-semibold text-slate-950">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{copy}</p></div>
      </div>
      {!last && <ArrowRight className="absolute right-[-9px] top-1/2 z-10 hidden -translate-y-1/2 bg-white text-slate-300 lg:block" size={18} aria-hidden="true" />}
    </div>
  );
}
