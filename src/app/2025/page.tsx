import type { Metadata } from 'next';
import { Report2025 } from '@/components/report-2025/Report2025';

export const metadata: Metadata = {
  title: '2025 EHR Workforce Trends Report (Archive) | Bloomforce',
  description:
    'Archived 2025 report: salary benchmarks, workforce sentiment, and industry trends from 300+ healthcare IT professionals surveyed Nov 2024 – Jan 2025.',
  robots: { index: true, follow: true },
};

export default function Report2025Page() {
  return <Report2025 />;
}
