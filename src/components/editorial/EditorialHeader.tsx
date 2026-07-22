'use client';

import Image from 'next/image';
import { formatDate } from '@/lib/insights/format';
import { SURVEY_URL } from '@/lib/constants';
import type { FreshnessMeta } from '@/lib/insights/types';
import styles from './editorial.module.css';

const NAV_ITEMS = [
  { label: 'Overview', href: '#briefing-benchmark' },
  { label: 'Cost', href: '#briefing-cost' },
  { label: 'Demand', href: '#briefing-demand' },
  { label: 'Workforce', href: '#briefing-workforce' },
  { label: 'Leadership', href: '#briefing-actions' },
] as const;

export function EditorialHeader({ freshness }: { freshness: FreshnessMeta }) {
  return (
    <header className={styles.reportHeader}>
      <div className={styles.liveStrip}>
        <span className={styles.liveSignal}>
          <i aria-hidden="true" /> Live market read
        </span>
        <span className={styles.liveDetail}>
          {freshness.totalRespondents.toLocaleString()} salary survey participants · continuous market analysis
        </span>
        <span className={styles.liveDate}>Updated {formatDate(freshness.asOf)}</span>
        <a href={SURVEY_URL}>Add your perspective</a>
      </div>
      <div className={styles.reportNav}>
        <a href="#briefing-top" className={styles.brand} aria-label="Bloomforce Insights home">
          <Image src="/images/logo-color.svg" alt="Bloomforce" width={151} height={35} priority />
          <span>Insights</span>
        </a>
        <nav aria-label="Executive briefing chapters">
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <a className={styles.headerCta} href="#briefing-actions">
          Leadership brief
        </a>
      </div>
    </header>
  );
}
