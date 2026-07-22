'use client';

import { useBenchmark } from '@/hooks/useBenchmark';
import styles from './editorial.module.css';

export function EditorialHero() {
  const { data } = useBenchmark();

  return (
    <section id="briefing-benchmark" className={`${styles.hero} ${styles.heroEditorial}`}>
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>The 2026 executive market briefing</p>
        <h1>
          The EHR talent market.
          <em>Measured while it moves.</em>
        </h1>
        <p className={styles.heroLead}>
          We combine an ongoing salary survey with continuous analysis of the current EHR job market to show
          health system leaders what talent costs, where hiring gets difficult, and what professionals value now.
        </p>
        <div className={styles.heroProof}>
          <span><strong>{data.freshness.totalRespondents.toLocaleString()}</strong> salary survey participants</span>
          <span><strong>{data.freshness.benchmarkCells.toLocaleString()}</strong> salary benchmarks</span>
          <span><strong>Ongoing</strong> market review</span>
        </div>
      </div>
    </section>
  );
}
