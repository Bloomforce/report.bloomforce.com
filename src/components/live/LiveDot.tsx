import { cn } from '@/lib/utils';

export function LiveDot({ size = 8, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('live-dot inline-block rounded-full bg-primary-light', className)}
      style={{ width: size, height: size }}
    />
  );
}
