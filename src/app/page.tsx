import { Report2025 } from '@/components/report-2025/Report2025';

// Temporary: the 2025 report holds the public page while the living-benchmark
// copy is under review at /preview. Swap InsightsPage back in to launch.
export default function Home() {
  return <Report2025 archiveBanner={false} />;
}
