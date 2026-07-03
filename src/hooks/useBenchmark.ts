'use client';

import { useContext } from 'react';
import { BenchmarkContext } from '@/components/benchmark/BenchmarkProvider';

export function useBenchmark() {
  const ctx = useContext(BenchmarkContext);
  if (!ctx) throw new Error('useBenchmark must be used within BenchmarkProvider');
  return ctx;
}
