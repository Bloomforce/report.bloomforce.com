import type { Metadata } from 'next';
import { MarketDataShell } from '@/components/admin/MarketDataShell';

export const metadata: Metadata = {
  title: 'Bloomforce Market Data',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <MarketDataShell>{children}</MarketDataShell>;
}
