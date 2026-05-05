import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'muted' | 'unlock';
  className?: string;
}

export function Badge({ children, variant = 'primary', className }: BadgeProps) {
  const variants = {
    primary: 'border-primary/25 bg-primary-50 text-primary-dark',
    muted: 'border-ink/10 bg-white text-text-muted',
    unlock: 'border-amber-200 bg-amber-50 text-amber-700',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-bold font-[family-name:var(--font-mono)] uppercase tracking-[0.22em]', variants[variant], className)}>
      {children}
    </span>
  );
}
