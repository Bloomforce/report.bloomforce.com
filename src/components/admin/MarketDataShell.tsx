'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Database,
  ExternalLink,
  FileUp,
  GitMerge,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin/market-explorer', label: 'Market Explorer', icon: BarChart3 },
  { href: '/admin/data-operations', label: 'Data Operations', icon: Database },
  { href: '/admin/organization-matching', label: 'Organization Matching', icon: GitMerge },
];

export function MarketDataShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f4f6f7] text-[#142033]">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="flex min-h-16 items-center gap-4 px-4 sm:px-6">
          <Link href="/admin/market-explorer" className="flex min-w-0 items-center gap-3">
            <span className="grid h-8 w-8 shrink-0 grid-cols-2 overflow-hidden border border-slate-200 bg-white p-1" aria-hidden="true">
              <span className="bg-[#00a896]" />
              <span />
              <span />
              <span className="bg-[#152033]" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-950">Bloomforce Market Data</span>
              <span className="block truncate text-[11px] text-slate-500">Internal workspace</span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Market data workspace">
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex h-9 items-center gap-2 border px-3 text-sm font-medium transition-colors',
                    active
                      ? 'border-slate-300 bg-slate-100 text-slate-950'
                      : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950',
                  )}
                >
                  <Icon size={15} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/admin/data-operations/intake"
            className="ml-auto inline-flex h-9 shrink-0 items-center gap-2 bg-[#152033] px-3 text-sm font-semibold text-white hover:bg-[#243043] lg:ml-2"
          >
            <FileUp size={15} aria-hidden="true" />
            <span className="hidden sm:inline">Add data</span>
          </Link>
          <a
            href="/preview"
            target="_blank"
            rel="noreferrer"
            className="hidden h-9 items-center gap-2 border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:inline-flex"
          >
            Public report <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>

        <nav className="flex overflow-x-auto border-t border-slate-100 px-3 lg:hidden" aria-label="Market data workspace">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium',
                  active ? 'border-[#00a896] text-slate-950' : 'border-transparent text-slate-500',
                )}
              >
                <Icon size={15} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      {children}
    </div>
  );
}
