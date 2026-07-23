'use client';

import { useEffect, type CSSProperties } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { EditorialChapter, type EditorialStoryStep } from './EditorialChapter';
import { useBenchmark } from '@/hooks/useBenchmark';
import { BOOK_CALL_URL, SURVEY_URL } from '@/lib/constants';
import { formatK } from '@/lib/insights/format';
import type { SentimentCut } from '@/lib/insights/types';
import styles from './editorial.module.css';

const STEPS: EditorialStoryStep[] = [
  {
    label: 'Price the real search',
    title: 'Price the role against the current market.',
    body: 'Set the salary range using current evidence, the experience the work requires, and the employers competing for the same expertise.',
  },
  {
    label: 'Design the whole offer',
    title: 'Decide the work model and scope before recruiting begins.',
    body: 'Candidates evaluate where they will work, what they will own, and where the role can lead. Making those decisions early gives the search team a clear and credible offer to take to the market.',
  },
  {
    label: 'Reach beyond applicants',
    title: 'Do not rely on the job posting alone.',
    body: 'Many qualified professionals are willing to listen but are not actively applying. Direct outreach should explain why the role is relevant, what makes it different, and why it may be worth considering now.',
  },
];

function cut(sentiment: SentimentCut[], key: string): SentimentCut | undefined {
  return sentiment.find((item) => item.metricKey === key && !item.cohort.roleFamily && !item.cohort.workModel);
}

function value(cutValue: SentimentCut | undefined, ...keys: string[]) {
  return Math.round((cutValue?.values.filter((item) => keys.includes(item.key)).reduce((sum, item) => sum + item.value, 0) ?? 0) * 100);
}

interface LeadershipBand {
  title: string;
  aliases: string;
  p25: number;
  p50: number;
  p75: number;
  n: number;
  source: string;
  sourceUrl?: string;
  sources?: Array<{ label: string; url: string }>;
  rangeLabel?: 'middle 50%' | 'posted range' | 'observed posting span' | 'progression reference';
  centerLabel?: 'median' | 'midpoint' | 'median midpoint' | 'reference';
  confidence: 'direct' | 'observed' | 'early signal';
}

interface LeadershipTrack {
  title: string;
  progression: string;
  levels: LeadershipBand[];
}

const SALARY_SCALE_MIN = 100_000;
const SALARY_SCALE_MAX = 350_000;

function salaryPosition(value: number) {
  return `${Math.max(0, Math.min(100, ((value - SALARY_SCALE_MIN) / (SALARY_SCALE_MAX - SALARY_SCALE_MIN)) * 100))}%`;
}

function LeadershipSalarySection({ manager }: { manager: LeadershipBand }) {
  const tracks: LeadershipTrack[] = [
    {
      title: 'Management',
      progression: 'Manager → Senior Manager',
      levels: [
        manager,
        {
          title: 'Senior Manager',
          aliases: 'Senior Manager',
          p25: 155_000,
          p50: 160_000,
          p75: 166_900,
          n: 7,
          source: 'salary survey',
          confidence: 'observed',
        },
      ],
    },
    {
      title: 'Director leadership',
      progression: 'Director → Senior / Executive Director',
      levels: [
        {
          title: 'Director',
          aliases: 'Director',
          p25: 169_789,
          p50: 185_252,
          p75: 213_672,
          n: 26,
          source: 'direct public records',
          confidence: 'direct',
        },
        {
          title: 'Senior / Executive Director',
          aliases: 'Senior Director · Executive Director',
          p25: 194_643,
          p50: 215_000,
          p75: 245_500,
          n: 30,
          source: '27 public records + 3 salary survey observations',
          rangeLabel: 'progression reference',
          centerLabel: 'reference',
          confidence: 'observed',
        },
      ],
    },
    {
      title: 'Vice president',
      progression: 'Associate / Assistant VP → Vice President',
      levels: [
        {
          title: 'Associate / Assistant VP',
          aliases: 'Enterprise Applications leadership',
          p25: 207_480,
          p50: 267_362,
          p75: 331_968,
          n: 2,
          source: 'current employer postings',
          sources: [
            {
              label: 'Stony Brook Medicine',
              url: 'https://stonybrooku.taleo.net/careersection/2/jobdetail.ftl?job=2602052',
            },
            {
              label: 'Advocate Health',
              url: 'https://builtin.com/job/associate-vice-president-billing-it-applications/8190782',
            },
          ],
          rangeLabel: 'observed posting span',
          centerLabel: 'median midpoint',
          confidence: 'observed',
        },
        {
          title: 'Vice President',
          aliases: 'Vice President',
          p25: 265_938,
          p50: 303_125,
          p75: 334_772,
          n: 6,
          source: 'survey and market observations',
          confidence: 'early signal',
        },
      ],
    },
  ];

  return (
    <section className={styles.leadershipSalarySection} aria-labelledby="leadership-salary-title">
      <div className={styles.leadershipSalaryIntro}>
        <div>
          <p className={styles.eyebrow}>Leadership compensation</p>
          <h3 id="leadership-salary-title">What EHR leadership salaries look like now.</h3>
        </div>
        <p>
          Each line groups adjacent titles on one shared salary scale, making the progression within a level easier to read.
          Associate Director is excluded until there is enough evidence for a dependable benchmark.
        </p>
      </div>

      <div className={styles.salaryScale} aria-hidden="true">
        <span>$100k</span><span>$150k</span><span>$200k</span><span>$250k</span><span>$300k</span><span>$350k</span>
      </div>
      <div className={styles.leadershipSalaryRows}>
        {tracks.map((track) => (
          <article key={track.title} className={styles.leadershipTrackRow}>
            <div className={styles.leadershipTrackTitle}>
              <strong>{track.title}</strong>
              <span>{track.progression}</span>
            </div>
            <div
              className={styles.leadershipProgression}
              aria-label={track.levels.map((band) => {
                const rangeLabel = band.rangeLabel ?? 'middle 50%';
                const centerLabel = band.centerLabel ?? 'median';
                return `${band.title}: ${formatK(band.p25)} to ${formatK(band.p75)} ${rangeLabel}, ${formatK(band.p50)} ${centerLabel}`;
              }).join('. ')}
            >
              {track.levels.map((band) => {
                const style = {
                  '--salary-start': salaryPosition(band.p25),
                  '--salary-end': salaryPosition(band.p75),
                  '--salary-median': salaryPosition(band.p50),
                } as CSSProperties;
                return (
                  <div key={band.title} className={styles.leadershipProgressionLane} style={style}>
                    <small>{band.title}</small>
                    <span aria-hidden="true" />
                    <i aria-hidden="true" />
                  </div>
                );
              })}
            </div>
            <div className={styles.leadershipTrackValues}>
              {track.levels.map((band) => (
                <div key={band.title}>
                  <span>{band.title}</span>
                  <strong>{formatK(band.p50)}</strong>
                  <small>{band.centerLabel ?? 'median'}</small>
                </div>
              ))}
            </div>
            <div className={styles.leadershipTrackEvidence}>
              {track.levels.map((band) => (
                <p key={band.title}>
                  <strong>{band.title}</strong> · {band.n} {band.n === 1 ? 'observation' : 'observations'} ·{' '}
                  {band.sourceUrl
                    ? <a href={band.sourceUrl} target="_blank" rel="noreferrer">{band.source}</a>
                    : band.sources
                      ? band.sources.map((source, index) => (
                          <span key={source.url}>
                            {index > 0 ? ' + ' : ''}
                            <a href={source.url} target="_blank" rel="noreferrer">{source.label}</a>
                          </span>
                        ))
                      : band.source}
                </p>
              ))}
            </div>
          </article>
        ))}
      </div>
      <p className={styles.leadershipSalaryNote}>
        Base salary only. Incentive compensation, retirement contributions, and other executive benefits are not included.
        Associate Director is omitted because one posting is not enough to support a market benchmark. The Senior / Executive
        Director reference combines 27 public records with three salary survey observations. Associate VP remains directional;
        the Advocate Health hourly range is annualized at 2,080 hours.
      </p>
    </section>
  );
}

export function ActionChapter() {
  const { data, row, roleName, profile } = useBenchmark();

  useEffect(() => {
    if (window.location.hash !== '#leadership-salary-title') return;
    const timeout = window.setTimeout(() => {
      document.getElementById('leadership-salary-title')?.scrollIntoView({ block: 'start' });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, []);

  const rto = cut(data.sentiment, 'rto_response');
  const seeking = cut(data.sentiment, 'job_seeking');
  const selectedDemand = data.demand.find((item) => item.key === profile.roleKey);
  const pushback = value(rto, 'look', 'negotiate');
  const openToMove = value(seeking, 'passive', 'planning', 'active');
  const managerBenchmark = data.benchmarks.find(
    (item) => item.roleFamily === 'MGR'
      && item.seniority === 'ALL'
      && item.region === 'National'
      && item.workModel === 'all'
      && item.employerType === 'all'
      && item.module === 'all',
  );
  const managerBand: LeadershipBand = {
    title: 'Manager',
    aliases: 'Associate Manager · Manager',
    p25: managerBenchmark?.blended.p25 ?? 116_701,
    p50: managerBenchmark?.blended.p50 ?? 135_533,
    p75: managerBenchmark?.blended.p75 ?? 156_335,
    n: managerBenchmark?.n ?? 251,
    source: 'current blended benchmark',
    confidence: 'direct',
  };

  const briefs = [
    {
      title: `${roleName} market position`,
      signal: row ? formatK(row.blended.p50) : 'Private review',
      signalLabel: 'current median',
      items: [
        row ? `Use ${formatK(row.blended.p25)}–${formatK(row.blended.p75)} as the current middle-market reference.` : 'Confirm the current leadership range before opening the search.',
        'Match the band to the experience and independence the work actually requires.',
        'Review the employer peer set before final approval.',
      ],
    },
    {
      title: 'Reachable talent market',
      signal: pushback ? `${pushback}%` : 'National',
      signalLabel: pushback ? 'would push back on RTO' : 'remote competition',
      items: [
        'Decide where flexibility is essential and where it is genuinely negotiable.',
        'Describe the scope and decision authority as clearly as the requirements.',
        'Make the career case visible before the interview process starts.',
      ],
    },
    {
      title: 'Search timing',
      signal: openToMove ? `${openToMove}%` : `${Math.round((selectedDemand?.share ?? 0) * 100)}%`,
      signalLabel: openToMove ? 'open to a move' : 'share of current demand',
      items: [
        'Build the target market before relying on applicants.',
        'Lead outreach with why this role is worth considering now.',
        'Use live market movement to adjust before the search stalls.',
      ],
    },
  ];

  function renderVisual(step: number) {
    const brief = briefs[step];
    return (
      <div className={styles.actionBrief}>
        <div className={styles.actionBriefHead}>
          <div><p className={styles.visualKicker}>Leadership decision brief</p><h3>{brief.title}</h3></div>
          <div><strong>{brief.signal}</strong><span>{brief.signalLabel}</span></div>
        </div>
        <ol>
          {brief.items.map((item) => (
            <li key={item}><CheckCircle2 aria-hidden="true" /><span>{item}</span></li>
          ))}
        </ol>
        <p className={styles.actionContext}>Prepared against the current {roleName.toLowerCase()} benchmark.</p>
      </div>
    );
  }

  const closing = (
    <>
      <LeadershipSalarySection manager={managerBand} />
      <div className={styles.closingGrid}>
        <div className={styles.closingPrimary}>
          <p className={styles.eyebrow}>Bring us the role</p>
          <h3>Turn the benchmark into a hiring decision.</h3>
          <p>We will walk through the market, the range, the available talent, and what it will take to make the search work.</p>
          <a href={`${BOOK_CALL_URL}?utm_source=insights&utm_content=executive-briefing-${profile.roleKey}`}>
            Request a market review <ArrowRight aria-hidden="true" />
          </a>
        </div>
        <div className={styles.closingSecondary}>
          <p className={styles.eyebrow}>Keep the benchmark current</p>
          <h3>Add your experience to the 2026 survey.</h3>
          <p>Five to seven minutes, fully anonymous, and every response sharpens the next market refresh.</p>
          <a href={SURVEY_URL}>Take the 2026 survey <ArrowRight aria-hidden="true" /></a>
        </div>
      </div>
    </>
  );

  return (
    <EditorialChapter
      id="briefing-actions"
      number="04"
      eyebrow="Hiring decisions"
      title="Turn the market data into a better hiring plan."
      intro="The compensation, demand, and workforce data point to three practical decisions: how to price the role, how to structure the offer, and how to reach the right candidates."
      steps={STEPS}
      renderVisual={(step) => renderVisual(step)}
      after={closing}
    />
  );
}
