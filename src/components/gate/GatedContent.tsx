'use client';

import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useGate } from '@/hooks/useGate';
import { cn } from '@/lib/utils';

interface GatedContentProps {
  children: React.ReactNode;
  className?: string;
  message?: string;
}

export function GatedContent({ children, className, message = 'Request access to the full report' }: GatedContentProps) {
  const { isUnlocked, showModal } = useGate();

  if (isUnlocked) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn('relative', className)}>
      <div className="blur-[6px] pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg/60 backdrop-blur-[2px] rounded-xl">
        <div className="flex flex-col items-center text-center px-4">
          <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mb-3">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-navy mb-3">{message}</p>
          <Button size="sm" onClick={showModal}>
            Request Access
          </Button>
        </div>
      </div>
    </div>
  );
}
