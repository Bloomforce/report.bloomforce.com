import { cn } from '@/lib/utils';
import { formatK } from '@/lib/insights/format';

interface DeltaTagProps {
  value: number;
  unit?: '$' | 'pts' | '%';
  period?: string;
  className?: string;
}

export function DeltaTag({ value, unit = '$', period, className }: DeltaTagProps) {
  const flat = value === 0;
  const up = value > 0;
  const magnitude =
    unit === '$' ? formatK(Math.abs(value)) : unit === 'pts' ? `${Math.abs(value)} pts` : `${Math.abs(value)}%`;

  return (
    <span
      className={cn(
        'inline-flex items-baseline gap-1 font-[family-name:var(--font-mono)] text-xs font-medium tabular-nums',
        flat ? 'text-text-light' : up ? 'text-[var(--color-up)]' : 'text-[var(--color-down)]',
        className,
      )}
    >
      <span aria-hidden="true">{flat ? '±0' : up ? '▲' : '▼'}</span>
      <span className="sr-only">{flat ? 'unchanged' : up ? 'up' : 'down'}</span>
      {!flat && magnitude}
      {period && <span className="text-text-light">· {period}</span>}
    </span>
  );
}
