import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/insights/format';

const TIER_STYLES: Record<string, string> = {
  direct: 'bg-primary-100 text-primary-dark',
  blended: 'bg-[#FBEED3] text-[#8A5D10]',
  modeled: 'bg-bg-subtle text-text-muted',
};

interface FreshnessPillProps {
  n?: number;
  confidenceTier?: 'direct' | 'blended' | 'modeled';
  updatedAt?: string;
  note?: string;
  className?: string;
}

export function FreshnessPill({ n, confidenceTier, updatedAt, note, className }: FreshnessPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-1 text-[11px] text-text-muted',
        className,
      )}
    >
      {typeof n === 'number' && <span className="font-[family-name:var(--font-mono)] tabular-nums">n={n.toLocaleString()}</span>}
      {confidenceTier && (
        <span className={cn('rounded px-1.5 py-0.5 font-semibold uppercase tracking-wide text-[9.5px]', TIER_STYLES[confidenceTier])}>
          {confidenceTier}
        </span>
      )}
      {updatedAt && <span>updated {formatDate(updatedAt)}</span>}
      {note && <span>{note}</span>}
    </span>
  );
}
