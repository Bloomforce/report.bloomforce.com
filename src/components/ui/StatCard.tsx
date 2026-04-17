'use client';

import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { cn } from '@/lib/utils';
import { Heart, Laptop, ThumbsUp, AlertTriangle, Cpu, Award, DollarSign, TrendingUp } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  heart: Heart,
  laptop: Laptop,
  thumbsUp: ThumbsUp,
  alertTriangle: AlertTriangle,
  cpu: Cpu,
  award: Award,
  dollarSign: DollarSign,
  trendingUp: TrendingUp,
};

interface StatCardProps {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  icon?: string;
  className?: string;
}

export function StatCard({ value, suffix = '', prefix = '', label, icon, className }: StatCardProps) {
  const { count, ref } = useAnimatedCounter(value);
  const Icon = icon ? iconMap[icon] : null;

  const displayValue = prefix === '$'
    ? `$${count.toLocaleString()}`
    : `${prefix}${count}${suffix}`;

  return (
    <div className={cn('bg-white rounded-xl p-6 border border-ink/10 shadow-sm shadow-ink/[0.03] hover:shadow-md transition-shadow', className)}>
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      )}
      <span ref={ref} className="block text-3xl font-[family-name:var(--font-heading)] text-primary mb-2">
        {displayValue}
      </span>
      <p className="text-sm text-text-muted leading-relaxed">{label}</p>
    </div>
  );
}
