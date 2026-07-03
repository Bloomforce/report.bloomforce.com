'use client';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SectionCTABandProps {
  title: string;
  subtitle?: string;
  buttonLabel: string;
  onClick?: () => void;
  href?: string;
  className?: string;
}

/** Every section ends in a next step — never a dead end. */
export function SectionCTABand({ title, subtitle, buttonLabel, onClick, href, className }: SectionCTABandProps) {
  return (
    <div
      className={cn(
        'mt-10 bg-white rounded-2xl border border-ink/10 border-l-4 border-l-primary shadow-sm shadow-ink/[0.03]',
        'px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between',
        className,
      )}
    >
      <div>
        <p className="font-semibold text-navy">{title}</p>
        {subtitle && <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>}
      </div>
      {href ? (
        <Button href={href} className="shrink-0">
          {buttonLabel}
        </Button>
      ) : (
        <Button onClick={onClick} className="shrink-0">
          {buttonLabel}
        </Button>
      )}
    </div>
  );
}
