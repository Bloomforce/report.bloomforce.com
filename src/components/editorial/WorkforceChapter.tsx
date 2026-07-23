'use client';

import { useMemo } from 'react';
import { DotSwarm, type SwarmDot, type SwarmLayout } from '@/components/scrolly/DotSwarm';
import { EditorialChapter, type EditorialStoryStep } from './EditorialChapter';
import { useBenchmark } from '@/hooks/useBenchmark';
import { apportionWholePercentages } from '@/lib/insights/format';
import type { SentimentCut } from '@/lib/insights/types';
import styles from './editorial.module.css';

const CYAN = '#52d7c5';
const BLUE = '#6996f0';
const AMBER = '#f2b853';
const CORAL = '#ef6f79';
const MIST = '#c4d0ca';
const DOTS = 240;

interface Group {
  key: string;
  label: string;
  value: number;
  displayPercent: number;
  color: string;
}

interface WorkforceFrame {
  metricKey: string;
  question: string;
  n: number;
  groups: Group[];
}

function broadCut(sentiment: SentimentCut[], metricKey: string): SentimentCut | undefined {
  return sentiment.find(
    (item) => item.metricKey === metricKey && !item.cohort.roleFamily && !item.cohort.workModel && !item.cohort.region,
  );
}

function makeGroups(cut: SentimentCut | undefined, colors: string[]): Group[] {
  const values = cut?.values ?? [];
  const total = values.reduce((sum, item) => sum + Math.max(0, item.value), 0);
  const normalized = values.map((item) => total > 0 ? Math.max(0, item.value) / total : 0);
  const displayed = apportionWholePercentages(normalized);
  return values.map((item, index) => ({
    key: item.key,
    label: item.label,
    value: normalized[index],
    displayPercent: displayed[index],
    color: colors[index] ?? MIST,
  }));
}

function assignGroup(index: number, groups: Group[]): string {
  const value = ((index * 73 + 19) % 997) / 997;
  let total = 0;
  for (const group of groups) {
    total += group.value;
    if (value <= total) return group.key;
  }
  return groups.at(-1)?.key ?? '';
}

function peopleGridPosition(index: number, size: number, groupIndex: number, groupCount: number) {
  const gap = 0.018;
  const usableWidth = 0.9;
  const laneWidth = (usableWidth - gap * (groupCount - 1)) / groupCount;
  const laneStart = 0.05 + groupIndex * (laneWidth + gap);
  const columns = groupCount >= 4 ? 7 : groupCount === 3 ? 10 : 14;
  const rows = Math.ceil(size / columns);
  const column = index % columns;
  const row = Math.floor(index / columns);
  const gridHeight = Math.min(0.68, Math.max(0.22, (rows - 1) * 0.036));
  const rowGap = rows > 1 ? gridHeight / (rows - 1) : 0;
  return {
    x: laneStart + ((column + 0.5) / columns) * laneWidth,
    y: 0.5 - gridHeight / 2 + row * rowGap,
  };
}

function WorkforceVisual({ frame, dots, mobile }: { frame: WorkforceFrame; dots: SwarmDot[]; mobile: boolean }) {
  if (!frame.groups.length) return <p className={styles.noData}>This workforce cut is still collecting enough responses.</p>;

  if (mobile) {
    return (
      <figure className={styles.mobileDistribution} aria-label={frame.question}>
        <figcaption>{frame.n.toLocaleString()} responses</figcaption>
        {frame.groups.map((group) => (
          <div key={group.key}>
            <span>{group.label}</span>
            <i><b style={{ width: `${group.value * 100}%`, backgroundColor: group.color }} /></i>
            <strong>{group.displayPercent}%</strong>
          </div>
        ))}
      </figure>
    );
  }

  const groupSizes = Object.fromEntries(
    frame.groups.map((group) => [group.key, dots.filter((dot) => dot.tags[frame.metricKey] === group.key).length]),
  );
  const seen: Record<string, number> = {};
  const indexWithinGroup = dots.map((dot) => {
    const key = dot.tags[frame.metricKey];
    const index = seen[key] ?? 0;
    seen[key] = index + 1;
    return index;
  });
  const layout: SwarmLayout = {
    place: (dot, index) => {
      const key = dot.tags[frame.metricKey];
      const groupIndex = frame.groups.findIndex((group) => group.key === key);
      const position = peopleGridPosition(
        indexWithinGroup[index],
        groupSizes[key] ?? 1,
        Math.max(0, groupIndex),
        frame.groups.length,
      );
      return {
        ...position,
        color: frame.groups[groupIndex]?.color ?? MIST,
        alpha: 1,
        r: 3.4,
        shape: 'person',
      };
    },
  };

  return (
    <figure className={styles.swarmFigure} aria-label={frame.question}>
      <figcaption>
        <span>{frame.question}</span>
        <small>{frame.n.toLocaleString()} responses</small>
      </figcaption>
      <div className={styles.swarmCanvas}>
        <DotSwarm dots={dots} layout={layout} />
      </div>
      <div className={styles.swarmLabels} style={{ gridTemplateColumns: `repeat(${frame.groups.length}, minmax(0, 1fr))` }}>
        {frame.groups.map((group) => (
          <div key={group.key}>
            <i style={{ backgroundColor: group.color }} />
            <strong>{group.displayPercent}%</strong>
            <span>{group.label}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}

export function WorkforceChapter() {
  const { data } = useBenchmark();
  const steps: EditorialStoryStep[] = [
    {
      label: 'Where work happens',
      title: 'The work model determines how many candidates you can reach.',
      body: 'Remote roles can reach a national talent pool. Hybrid and on-site requirements reduce that pool to people who already live nearby or are willing to relocate.',
    },
    {
      label: 'The RTO response',
      title: 'A return-to-office mandate can push employees into the job market.',
      body: 'Most surveyed professionals said they would negotiate or begin looking for another role rather than simply comply. Employers planning a return mandate should expect some employees to reconsider whether they want to stay.',
    },
    {
      label: 'How employees view AI',
      title: 'Most respondents expect AI to change the work, not simply replace it.',
      body: 'The survey shows whether professionals expect AI to enhance their work, fundamentally change their role, have little impact, or replace part of the work. Hiring leaders should explain how AI will affect responsibilities, required skills, and career paths.',
      evidence: 'This chart reflects responses from the broader surveyed EHR workforce.',
    },
    {
      label: 'Layoffs and reductions in force',
      title: 'Organizational changes can put experienced talent into the market.',
      body: 'Layoffs and reductions in force can make experienced professionals available before they appear in applicant databases or begin applying publicly. Employers that understand where change is occurring can reach that talent earlier.',
    },
  ];
  const frames = useMemo<WorkforceFrame[]>(() => {
    const workModel = broadCut(data.sentiment, 'remote_share');
    const rto = broadCut(data.sentiment, 'rto_response');
    const ai = broadCut(data.sentiment, 'ai_impact');
    const change = broadCut(data.sentiment, 'layoffs');
    return [
      { metricKey: 'remote_share', question: workModel?.question ?? 'Where work happens', n: workModel?.n ?? 0, groups: makeGroups(workModel, [CYAN, BLUE, MIST]) },
      { metricKey: 'rto_response', question: rto?.question ?? 'Response to a return-to-office mandate', n: rto?.n ?? 0, groups: makeGroups(rto, [CORAL, AMBER, CYAN]) },
      { metricKey: 'ai_impact', question: 'How the workforce expects AI to affect its work', n: ai?.n ?? 0, groups: makeGroups(ai, [CYAN, BLUE, AMBER, CORAL]) },
      { metricKey: 'layoffs', question: change?.question ?? 'Organizational change experienced', n: change?.n ?? 0, groups: makeGroups(change, [CORAL, CYAN]) },
    ];
  }, [data.sentiment]);

  const dots = useMemo<SwarmDot[]>(() => Array.from({ length: DOTS }, (_, index) => ({
    tags: Object.fromEntries(frames.map((frame) => [frame.metricKey, assignGroup(index, frame.groups)])),
  })), [frames]);

  return (
    <EditorialChapter
      id="briefing-workforce"
      number="03"
      eyebrow="Workforce expectations"
      title="What candidates consider before accepting or leaving a role."
      intro="Salary gets a candidate's attention, but it is not the only decision. Work location, return-to-office policies, AI, and organizational change all affect who will consider a role and who may enter the market."
      steps={steps}
      tone="ink"
      renderVisual={(step, mobile) => <WorkforceVisual frame={frames[step]} dots={dots} mobile={mobile} />}
    />
  );
}
