'use client';

import { useContext } from 'react';
import { GateContext } from '@/components/gate/GateProvider';

export function useGate() {
  return useContext(GateContext);
}
