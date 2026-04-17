'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import type { SentimentDataPoint } from '@/lib/types';

interface HorizontalBarChartProps {
  data: SentimentDataPoint[];
  color?: string;
}

const COLORS = ['#1DAFA1', '#1198A1', '#41ADB4', '#5A6B7F', '#8B95A3'];

export function HorizontalBarChart({ data, color }: HorizontalBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={data.length * 44 + 10}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 45, left: 10, bottom: 0 }}>
        <XAxis type="number" hide domain={[0, 100]} />
        <YAxis
          type="category"
          dataKey="label"
          width={140}
          fontSize={12}
          stroke="#5A6B7F"
          tick={{ fill: '#0B1D32' }}
          axisLine={false}
          tickLine={false}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
          {data.map((_, i) => (
            <Cell key={i} fill={color || COLORS[i % COLORS.length]} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v) => `${v}%`}
            style={{ fontSize: 12, fill: '#0B1D32', fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
