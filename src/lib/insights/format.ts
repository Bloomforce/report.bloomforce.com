export function formatK(value: number): string {
  if (Math.abs(value) >= 1000) {
    const k = value / 1000;
    return `$${k >= 100 ? Math.round(k) : Math.round(k * 10) / 10}k`;
  }
  return `$${Math.round(value).toLocaleString()}`;
}

export function formatSignedK(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${formatK(Math.abs(value)).replace('$', '$')}`;
}

export function formatPct(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function apportionWholePercentages(values: number[]): number[] {
  if (!values.length) return [];

  const safeValues = values.map((value) => Math.max(0, Number.isFinite(value) ? value : 0));
  const total = safeValues.reduce((sum, value) => sum + value, 0);
  if (total === 0) return safeValues.map(() => 0);

  const scaled = safeValues.map((value) => (value / total) * 100);
  const rounded = scaled.map(Math.floor);
  let remaining = 100 - rounded.reduce((sum, value) => sum + value, 0);
  const remainderOrder = scaled
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);

  for (let index = 0; index < remaining; index += 1) {
    rounded[remainderOrder[index].index] += 1;
  }

  return rounded;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  const days = Math.floor((now.getTime() - then) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
