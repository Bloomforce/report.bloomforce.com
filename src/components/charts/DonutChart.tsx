'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { SentimentDataPoint } from '@/lib/types';

interface DonutChartProps {
  data: SentimentDataPoint[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
}

const COLORS = ['#1DAFA1', '#121D2B', '#8B95A3', '#41ADB4', '#5A6B7F'];

export function DonutChart({ data, centerLabel, centerValue, size = 200 }: DonutChartProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={size * 0.32}
              outerRadius={size * 0.44}
              paddingAngle={2}
              dataKey="value"
              nameKey="label"
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0];
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 text-sm">
                    <p className="font-medium">{d.name}: <span className="text-primary">{d.value}%</span></p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {centerValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-[family-name:var(--font-heading)] text-primary">{centerValue}</span>
            {centerLabel && <span className="text-xs text-text-muted">{centerLabel}</span>}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-xs text-text-muted">{d.label} ({d.value}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
