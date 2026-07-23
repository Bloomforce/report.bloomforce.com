'use client';

import { Libre_Franklin, Newsreader, Spline_Sans_Mono } from 'next/font/google';
import { GateProvider } from '@/components/gate/GateProvider';
import { LeadCaptureModal } from '@/components/gate/LeadCaptureModal';
import { BenchmarkProvider } from '@/components/benchmark/BenchmarkProvider';
import { EditorialHeader } from './EditorialHeader';
import { EditorialHero } from './EditorialHero';
import { CostChapter } from './CostChapter';
import { DemandChapter } from './DemandChapter';
import { WorkforceChapter } from './WorkforceChapter';
import { ActionChapter } from './ActionChapter';
import type { InsightsData } from '@/lib/insights/types';
import styles from './editorial.module.css';

const serif = Newsreader({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--editorial-serif' });
const sans = Libre_Franklin({ subsets: ['latin'], variable: '--editorial-sans' });
const mono = Spline_Sans_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--editorial-mono' });

function ChapterTransition({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <div className={styles.chapterTransition} aria-hidden="true">
      <span>{number}</span>
      <p>{children}</p>
    </div>
  );
}

export function EditorialBriefing({ data }: { data: InsightsData }) {
  return (
    <GateProvider>
      <BenchmarkProvider
        data={data}
        initialProfile={{ roleKey: 'AA', seniority: 'ALL', region: 'National' }}
        persistProfile={false}
      >
        <div id="briefing-top" className={`${styles.editorial} ${serif.variable} ${sans.variable} ${mono.variable}`}>
          <EditorialHeader freshness={data.freshness} />
          <main>
            <EditorialHero />
            <ChapterTransition number="01">First, understand what qualified Epic talent costs today.</ChapterTransition>
            <CostChapter />
            <ChapterTransition number="02">Then, see which roles and Epic applications are drawing more demand.</ChapterTransition>
            <DemandChapter />
            <ChapterTransition number="03">Demand matters, but candidates are also deciding which opportunities they will consider.</ChapterTransition>
            <WorkforceChapter />
            <ChapterTransition number="04">Together, these signals show how to structure and run the search.</ChapterTransition>
            <ActionChapter />
          </main>
          <footer className={styles.editorialFooter}>
            <div><strong>Bloomforce</strong><span>Executive Market Briefing · 2026</span></div>
            <p>Healthcare IT talent. It&apos;s all we do.</p>
            <nav aria-label="Report footer">
              <a href="https://www.bloomforce.com/privacy">Privacy</a>
              <a href="https://www.bloomforce.com">Bloomforce.com</a>
            </nav>
          </footer>
        </div>
        <LeadCaptureModal />
      </BenchmarkProvider>
    </GateProvider>
  );
}
