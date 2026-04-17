'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { SalaryBreakdownEntry } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface SalaryComparisonChartProps {
  entries: SalaryBreakdownEntry[];
  title?: string;
}

const COLORS = ['#1DAFA1', '#1198A1', '#41ADB4', '#0B1D32', '#5A6B7F', '#8B95A3', '#192654', '#1E2D45', '#D1F1EF'];

export function SalaryComparisonChart({ entries, title }: SalaryComparisonChartProps) {
  const data = entries.map((e) => ({
    name: e.label,
    median: e.distribution.median,
    p25: e.distribution.p25,
    p75: e.distribution.p75,
    low: e.distribution.low,
    high: e.distribution.high,
  }));

  return (
    <div>
      {title && <p className="text-sm font-medium text-text-muted mb-3">{title}</p>}
      <ResponsiveContainer width="100%" height={entries.length * 50 + 40}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
          <XAxis
            type="number"
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
            fontSize={11}
            stroke="#8B95A3"
          />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
            fontSize={12}
            stroke="#5A6B7F"
            tick={{ fill: '#0B1D32' }}
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
                  <p className="font-semibold text-navy mb-1">{d.name}</p>
                  <p>Median: <strong className="text-primary">{formatCurrency(d.median)}</strong></p>
                  <p className="text-text-muted">Range: {formatCurrency(d.low)} – {formatCurrency(d.high)}</p>
                  <p className="text-text-muted">25th–75th: {formatCurrency(d.p25)} – {formatCurrency(d.p75)}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="median" radius={[0, 4, 4, 0]} barSize={24}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
