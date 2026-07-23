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
          <em>What health systems need to know now.</em>
        </h1>
        <p className={styles.heroLead}>
          This live briefing combines our ongoing salary survey with analysis of current EHR job postings. It
          answers four practical questions: what talent costs, which roles are getting harder to fill, what
          candidates expect, and how health system leaders should respond.
        </p>
        <div className={styles.heroProof}>
          <span><strong>{data.freshness.totalRespondents.toLocaleString()}</strong> salary survey participants</span>
          <span><strong>{data.freshness.benchmarkCells.toLocaleString()}</strong> salary benchmarks</span>
          <span><strong>{data.freshness.postingsIngested.toLocaleString()}</strong> job postings analyzed</span>
        </div>
      </div>
    </section>
  );
}
