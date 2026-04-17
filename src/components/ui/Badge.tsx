import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'muted' | 'unlock';
  className?: string;
}

export function Badge({ children, variant = 'primary', className }: BadgeProps) {
  const variants = {
    primary: 'text-primary',
    muted: 'text-text-muted',
    unlock: 'text-amber-700',
  };

  return (
    <span className={cn('inline-flex items-center text-[11px] font-[family-name:var(--font-mono)] uppercase tracking-[0.22em]', variants[variant], className)}>
      {children}
    </span>
  );
}
