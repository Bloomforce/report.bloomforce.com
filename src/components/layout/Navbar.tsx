'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { BOOK_CALL_URL, NAV_ITEMS } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
      )}
    >
      <div className="overflow-hidden border-b border-white/10 bg-purple-600 py-2.5">
        <div className="block px-4 text-center md:hidden">
          <a
            href="https://www.bloomforce.com/survey"
            className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-[13px] font-semibold text-white ring-1 ring-white/20 transition-all hover:bg-white/18"
          >
            <span>2026 Survey</span>
            <span className="text-white/70">5-7 min</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="hidden md:block">
          <div className="animate-marquee flex whitespace-nowrap">
            {[...Array(4)].map((_, i) => (
              <span
                key={i}
                className="mx-5 inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold tracking-wide text-white ring-1 ring-white/15"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/65">
                  2026 Workforce Survey
                </span>
                <span>Help shape the next report.</span>
                <a
                  href="https://www.bloomforce.com/survey"
                  className="rounded-full bg-white px-3 py-1 text-xs font-bold text-purple-600 transition-all hover:bg-bg"
                >
                  Take 5-7 min →
                </a>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <a href="https://www.bloomforce.com/" className="inline-flex shrink-0">
          <img src="/images/logo-color.svg" alt="Bloomforce" className="h-7" />
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-text-muted hover:text-primary transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <Button size="sm" href={BOOK_CALL_URL}>
            Talk to Us
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-navy"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-ink/10 shadow-lg">
          <div className="flex flex-col p-4 gap-3">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-text-muted hover:text-primary py-2"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Button size="sm" href={BOOK_CALL_URL} onClick={() => setMobileOpen(false)}>
              Talk to Us
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
