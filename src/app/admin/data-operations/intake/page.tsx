import type { Metadata } from 'next';
import { DataIntakeWorkspace } from '@/components/admin/DataIntakeWorkspace';

export const metadata: Metadata = {
  title: 'Add Data Source | Bloomforce',
  robots: { index: false, follow: false },
};

export default function DataIntakePage() {
  return <DataIntakeWorkspace />;
}
