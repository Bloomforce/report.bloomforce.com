'use client';

/**
 * "The Benchmark Briefing" — editorial scrollytelling homepage candidate,
 * rendered entirely from the live benchmark (Supabase views via
 * getInsightsData, fixtures in local dev). Unlisted at /preview/briefing.
 */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Newsreader, Libre_Franklin, Spline_Sans_Mono } from 'next/font/google';
import type { BenchmarkRow, InsightsData } from '@/lib/insights/types';
import { EMPLOYER_TYPE_LABELS } from '@/lib/insights/employer-types';
import { Count, GrowBar, Reveal, cut, fmtDate, fmtK, isBlendedCut, ladder, overall, pct, pctDelta } from './shared';

/** Employer-type cuts for one role family: National, all seniorities, blended work model. */
function orgCuts(data: InsightsData, roleFamily: string): BenchmarkRow[] {
  const seen = new Set<string>();
  return data.benchmarks
    .filter(
      (b) =>
        b.roleFamily === roleFamily &&
        b.module === 'all' &&
        b.seniority === 'ALL' &&
        b.region === 'National' &&
        b.workModel === 'all' &&
        b.employerType !== 'all'
    )
    .filter((b) => (seen.has(b.employerType) ? false : (seen.add(b.employerType), true)))
    .sort((a, b) => b.blended.p50 - a.blended.p50);
}

/* ---------- org-type slice ---------- */

function OrgSlice({ data }: { data: InsightsData }) {
  const rolesWithCuts = useMemo(
    () =>
      data.roles.filter((r, i, arr) => {
        if (arr.findIndex((x) => x.roleKey === r.roleKey) !== i) return false;
        return orgCuts(data, r.roleKey).length >= 2;
      }),
    [data]
  );
  const [roleKey, setRoleKey] = useState(rolesWithCuts[0]?.roleKey ?? 'AA');
  const cuts = orgCuts(data, roleKey);
  const max = cuts[0]?.blended.p50 ?? 1;
  if (rolesWithCuts.length === 0) return null;
  return (
    <figure className="bf1-chart">
      <figcaption>Median comp by organization type</figcaption>
      <p className="bf1-chart-sub">National · all seniorities · roles with published org cuts</p>
      <div className="bf1-chips" role="tablist" aria-label="Role for org-type comparison">
        {rolesWithCuts.map((r) => (
          <button
            key={r.roleKey}
            role="tab"
            aria-selected={r.roleKey === roleKey}
            className={r.roleKey === roleKey ? 'bf1-chip bf1-chip-on' : 'bf1-chip'}
            onClick={() => setRoleKey(r.roleKey)}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="bf1-hbars" style={{ marginTop: 18 }}>
        {cuts.map((c, i) => (
          <div key={c.employerType} className={i === 0 ? 'bf1-hbar bf1-hot' : 'bf1-hbar'}>
            <div className="bf1-hbar-lab">
              <span>
                {EMPLOYER_TYPE_LABELS[c.employerType] ?? c.employerType}
                {c.confidenceTier === 'modeled' && <em className="bf1-modeled"> · modeled</em>}
              </span>
              <span className="bf1-hbar-v">
                {fmtK(c.blended.p50)} <i className="bf1-n">n={c.n}</i>
              </span>
            </div>
            <div className="bf1-track">
              <GrowBar
                className={c.confidenceTier === 'modeled' ? 'bf1-fill bf1-fill-soft' : 'bf1-fill'}
                widthPct={(c.blended.p50 / max) * 100}
                delay={i * 0.06}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="bf1-chart-note">
        &ldquo;Modeled&rdquo; cells lean on thin samples — treat as directional. More contributions
        sharpen them automatically.
      </p>
    </figure>
  );
}

const serif = Newsreader({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--bf1-serif' });
const sans = Libre_Franklin({ subsets: ['latin'], variable: '--bf1-sans' });
const mono = Spline_Sans_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--bf1-mono' });

/* ---------- salary rail ---------- */

function Rail({ row, min, max }: { row: BenchmarkRow; min: number; max: number }) {
  const span = max - min || 1;
  const x = (v: number) => ((v - min) / span) * 100;
  const b = row.blended;
  return (
    <div className="bf1-rail">
      <motion.div
        className="bf1-band"
        initial={false}
        animate={{ left: `${x(b.p25)}%`, width: `${x(b.p75) - x(b.p25)}%` }}
        transition={{ type: 'spring', stiffness: 170, damping: 26 }}
      />
      <span className="bf1-end" style={{ left: 0 }}>{fmtK(min)}</span>
      <span className="bf1-end" style={{ right: 0 }}>{fmtK(max)}</span>
      {([
        { v: b.p25, label: 'p25', med: false },
        { v: b.p50, label: 'median', med: true },
        { v: b.p75, label: 'p75', med: false },
      ] as const).map((t) => (
        <motion.div
          key={t.label}
          className={t.med ? 'bf1-tick bf1-tick-med' : 'bf1-tick'}
          initial={false}
          animate={{ left: `${x(t.v)}%` }}
          transition={{ type: 'spring', stiffness: 170, damping: 26 }}
        >
          <span className="bf1-tick-label">
            <b>{fmtK(t.v)}</b>
            {t.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function Spark({ points }: { points: number[] }) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const d = points
    .map((p, i) => `${(i / (points.length - 1)) * 100},${34 - ((p - min) / span) * 30}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 36" className="bf1-spark" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={d} fill="none" stroke="var(--bf1-green)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- interactive explorer ---------- */

function Explorer({ data }: { data: InsightsData }) {
  const families = useMemo(() => {
    const seen = new Set<string>();
    return data.roles
      .filter((r) => (seen.has(r.roleKey) ? false : (seen.add(r.roleKey), true)))
      .filter((r) => overall(data, r.roleKey));
  }, [data]);
  const [roleKey, setRoleKey] = useState(families[0]?.roleKey ?? 'AA');
  const [region, setRegion] = useState('National');
  const row = overall(data, roleKey, region) ?? overall(data, roleKey);
  const bounds = useMemo(() => {
    const rows = data.benchmarks.filter((b) => b.module === 'all' && b.seniority === 'ALL');
    return {
      min: Math.min(...rows.map((r) => r.blended.p10)),
      max: Math.max(...rows.map((r) => r.blended.p90)),
    };
  }, [data]);
  if (!row) return null;
  const delta = row.medianDelta90d;
  return (
    <figure className="bf1-chart" id="explorer">
      <figcaption>Explore the live benchmark</figcaption>
      <p className="bf1-chart-sub">
        Blended survey + postings data · updated {fmtDate(row.updatedAt)}
      </p>
      <div className="bf1-chips" role="tablist" aria-label="Role">
        {families.map((r) => (
          <button
            key={r.roleKey}
            role="tab"
            aria-selected={r.roleKey === roleKey}
            className={r.roleKey === roleKey ? 'bf1-chip bf1-chip-on' : 'bf1-chip'}
            onClick={() => setRoleKey(r.roleKey)}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="bf1-chips bf1-chips-sub" role="tablist" aria-label="Region">
        {data.regions.map((r) => (
          <button
            key={r}
            role="tab"
            aria-selected={r === region}
            className={r === region ? 'bf1-chip bf1-chip-on' : 'bf1-chip'}
            onClick={() => setRegion(r)}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="bf1-exp-read">
        <div>
          <span className="bf1-exp-med">{fmtK(row.blended.p50)}</span>
          <span className="bf1-exp-medlab">median · {row.region}</span>
        </div>
        <div className="bf1-exp-meta">
          {delta != null && delta !== 0 && (
            <span className={delta > 0 ? 'bf1-delta up' : 'bf1-delta down'}>
              {delta > 0 ? '▲' : '▼'} {fmtK(Math.abs(delta))} past 90 days
            </span>
          )}
          <span>n = {row.n}</span>
          <span className="bf1-conf">{row.confidenceTier}</span>
        </div>
      </div>
      <div className="bf1-rail-wrap">
        <Rail row={row} min={bounds.min} max={bounds.max} />
      </div>
      {row.spark && <Spark points={row.spark} />}
      <p className="bf1-chart-note">
        Shaded band = middle half of comp (p25–p75) on a common scale across every role. Director+
        benchmarks are call-only.
      </p>
    </figure>
  );
}

/* ---------- page ---------- */

export function BriefingScrolly({ data }: { data: InsightsData }) {
  const f = data.freshness;
  const aa = overall(data, 'AA');
  const rungSeen = new Set<string>();
  const rungs = data.benchmarks
    .filter(
      (b) =>
        b.roleFamily === 'AA' && b.region === 'National' && b.seniority !== 'ALL' && isBlendedCut(b)
    )
    .filter((b) => (rungSeen.has(b.seniority) ? false : (rungSeen.add(b.seniority), true)))
    .sort((a, b) => a.blended.p50 - b.blended.p50);
  const roleLadder = ladder(data);
  const maxMedian = roleLadder[0]?.blended.p50 ?? 1;

  const remote = data.workModels.find((w) => w.workModel === 'remote');
  const hybrid = data.workModels.find((w) => w.workModel === 'hybrid');
  const onsite = data.workModels.find((w) => w.workModel === 'onsite');
  const premium =
    remote?.median != null && onsite?.median != null ? remote.median - onsite.median : null;

  const rto = cut(data, 'rto_response');
  const mgr = cut(data, 'mgr_remote_view');
  const seeking = cut(data, 'job_seeking');
  const wlb = cut(data, 'satisfaction_wlb');
  const ai = cut(data, 'ai_impact');
  const aiOrg = cut(data, 'ai_org');
  const ma = cut(data, 'ma_activity');
  const layoffs = cut(data, 'layoffs');
  const maStronger = cut(data, 'ma_stronger');
  const mobility = cut(data, 'mobility_role');
  const fair = cut(data, 'fair_comp');
  const recognized = cut(data, 'recognized');

  const resist = pct(rto, 'look', 'negotiate');
  const wlbDelta = pctDelta(wlb, 'satisfied');

  return (
    <div className={`bf1 ${serif.variable} ${sans.variable} ${mono.variable}`}>
      <style>{CSS}</style>

      <div className="bf1-live" role="status">
        <span className="bf1-dot" aria-hidden="true" />
        LIVE BENCHMARK · updated {fmtDate(f.asOf)} · {f.totalRespondents.toLocaleString()} respondents ·{' '}
        {f.postingsIngested.toLocaleString()} postings · {f.benchmarkCells} cells
      </div>

      <nav className="bf1-nav">
        <a className="bf1-wordmark" href="#top">bloom<em>force</em></a>
        <div className="bf1-nav-r">
          <a className="bf1-nav-link" href="/preview">Full benchmark →</a>
          <a className="bf1-cta-pill" href="https://www.bloomforce.com/book">Book a call</a>
        </div>
      </nav>

      <header className="bf1-hero" id="top">
        <Reveal><p className="bf1-kicker">The Living EHR Talent Benchmark · {f.windowLabel}</p></Reveal>
        <Reveal delay={0.06}>
          <h1>
            <Count to={f.totalRespondents} /> professionals. Live postings.{' '}
            <span className="bf1-accent">One market, measured.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="bf1-hero-sub">
            Not analyst estimates — a rolling benchmark built from our own survey of the people who
            run Epic and the systems around it, refreshed as new responses and job postings arrive.
          </p>
        </Reveal>
        <Reveal delay={0.18}>
          <div className="bf1-hero-meta">
            <span>{f.benchmarkCells} benchmark cells</span>
            <span>{f.postingsIngested.toLocaleString()} postings ingested</span>
            <span>last ingest {fmtDate(f.lastSurveyIngest)}</span>
          </div>
        </Reveal>
        <Reveal delay={0.24}><p className="bf1-scroll-cue">Read the numbers ↓</p></Reveal>
      </header>

      <div className="bf1-ticker" aria-label="Latest benchmark moves">
        <div className="bf1-ticker-track">
          {[...data.pulse, ...data.pulse].map((p, i) => (
            <span key={`${p.id}-${i}`} className="bf1-pulse">
              <i className={`bf1-pk bf1-pk-${p.kind}`} />
              {p.text}
            </span>
          ))}
        </div>
      </div>

      {/* 01 · price of talent */}
      <section>
        <Reveal>
          <div className="bf1-sec-head">
            <span className="bf1-sec-num">LIVE / 01</span>
            <h2>What the market pays right now.</h2>
          </div>
        </Reveal>
        <div className="bf1-split">
          <div>
            <Reveal>
              <p className="bf1-lede">
                The Application Analyst — the workhorse role of every Epic shop — carries a national
                median of <strong>{fmtK(aa?.blended.p50)}</strong>
                {aa?.medianDelta90d ? (
                  <> and has moved <strong>{fmtK(Math.abs(aa.medianDelta90d))}</strong> in the last 90 days.</>
                ) : (
                  '.'
                )}
              </p>
            </Reveal>
            <Reveal>
              <p className="bf1-copy">
                The middle half of the market sits between <strong>{fmtK(aa?.blended.p25)}</strong> and{' '}
                <strong>{fmtK(aa?.blended.p75)}</strong> — but the tails run from{' '}
                {fmtK(aa?.blended.p10)} to {fmtK(aa?.blended.p90)}. If your bands were set two budget
                cycles ago, you're negotiating against a market that has already moved.
              </p>
            </Reveal>
            <Reveal>
              <div className="bf1-pull">
                <div className="bf1-pull-big"><Count to={(aa?.blended.p50 ?? 0) / 1000} prefix="$" suffix="K" /></div>
                <p className="bf1-pull-label">national median, all seniorities · n={aa?.n} · updates as data lands</p>
              </div>
            </Reveal>
          </div>
          <Reveal>
            {aa && (
              <figure className="bf1-chart">
                <figcaption>Application Analyst · live distribution</figcaption>
                <p className="bf1-chart-sub">National · all seniorities · {f.windowLabel}</p>
                <div className="bf1-rail-wrap">
                  <Rail row={aa} min={aa.blended.p10} max={aa.blended.p90} />
                </div>
                {aa.spark && <Spark points={aa.spark} />}
                <p className="bf1-chart-note">Trailing 12-month median trend below the rail.</p>
              </figure>
            )}
          </Reveal>
        </div>
      </section>

      {/* 02 · explorer */}
      <section>
        <Reveal>
          <div className="bf1-sec-head">
            <span className="bf1-sec-num">LIVE / 02</span>
            <h2>Your seat, benchmarked in ten seconds.</h2>
          </div>
        </Reveal>
        <Reveal><Explorer data={data} /></Reveal>
      </section>

      {/* 03 · remote */}
      <section>
        <Reveal>
          <div className="bf1-sec-head">
            <span className="bf1-sec-num">LIVE / 03</span>
            <h2>Location is compensation now.</h2>
          </div>
        </Reveal>
        <div className="bf1-split bf1-rev">
          <Reveal>
            <figure className="bf1-chart">
              <figcaption>Median comp by work model</figcaption>
              <p className="bf1-chart-sub">And where the workforce actually sits</p>
              <div className="bf1-hbars">
                {[
                  { label: 'Remote', w: remote, hot: true },
                  { label: 'Hybrid', w: hybrid, hot: false },
                  { label: 'On-site', w: onsite, hot: false },
                ].map(({ label, w, hot }) =>
                  w?.median != null ? (
                    <div key={label} className={hot ? 'bf1-hbar bf1-hot' : 'bf1-hbar'}>
                      <div className="bf1-hbar-lab">
                        <span>{label} · {Math.round(w.share * 100)}% of workforce</span>
                        <span className="bf1-hbar-v">{fmtK(w.median)} median</span>
                      </div>
                      <div className="bf1-track">
                        <GrowBar className="bf1-fill" widthPct={(w.median / (remote?.median ?? w.median)) * 100} />
                      </div>
                    </div>
                  ) : null
                )}
              </div>
              {premium != null && premium > 0 && (
                <p className="bf1-delta-line">The remote premium: {fmtK(premium)}.</p>
              )}
              <p className="bf1-chart-note">n = {data.workModels.reduce((a, w) => a + w.n, 0).toLocaleString()} comp points.</p>
            </figure>
          </Reveal>
          <div>
            <Reveal>
              <p className="bf1-lede">
                <strong>{Math.round((remote?.share ?? 0) * 100)}% of this workforce is remote</strong>
                {premium != null && premium > 0 && (
                  <> — and remote comp clears on-site by {fmtK(premium)} at the median.</>
                )}
              </p>
            </Reveal>
            <Reveal>
              <p className="bf1-copy">
                A remote req competes with every health system in the country; an on-site req competes
                with your metro area. Managers have stopped fighting it:{' '}
                <strong>{pct(mgr, 'equal', 'more')}% say remote team members are equally or more productive.</strong>
              </p>
            </Reveal>
            <Reveal>
              <div className="bf1-pull">
                <div className="bf1-pull-big"><Count to={pct(mgr, 'equal', 'more')} suffix="%" /></div>
                <p className="bf1-pull-label">of managers: remote is just as productive ({pct(mgr, 'equal')}%) or more ({pct(mgr, 'more')}%)</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 04 · RTO cliff */}
      <section>
        <Reveal>
          <div className="bf1-sec-head">
            <span className="bf1-sec-num">LIVE / 04</span>
            <h2>The return-to-office cliff.</h2>
          </div>
        </Reveal>
        <Reveal>
          <p className="bf1-lede" style={{ maxWidth: '62ch' }}>
            We asked: <em className="bf1-serif-it">&ldquo;{rto?.question}?&rdquo;</em> The current answer, from{' '}
            {rto?.n} respondents:
          </p>
        </Reveal>
        <Reveal>
          <figure className="bf1-chart" style={{ marginTop: 36 }}>
            <figcaption>Response to an RTO mandate</figcaption>
            <p className="bf1-chart-sub">Live · {rto ? `surveyed ${rto.surveyYear}–present` : ''}</p>
            <div className="bf1-stack">
              {rto?.values.map((v) => (
                <motion.div
                  key={v.key}
                  className={`bf1-seg bf1-seg-${v.key}`}
                  style={{ width: `${v.value * 100}%` }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], transformOrigin: 'left' } as never}
                >
                  {v.value >= 0.15 ? `${Math.round(v.value * 100)}%` : ''}
                </motion.div>
              ))}
            </div>
            <div className="bf1-legend">
              {rto?.values.map((v) => (
                <span key={v.key}>
                  <i className={`bf1-seg-${v.key}`} />
                  {v.label} — {Math.round(v.value * 100)}%
                </span>
              ))}
            </div>
            <p className="bf1-chart-note">{resist}% would negotiate or leave.</p>
          </figure>
        </Reveal>
        <Reveal>
          <div className="bf1-aside">
            <p className="bf1-aside-t">The market aside</p>
            <p>
              Where would they go? The benchmark already knows:{' '}
              <strong>{pct(seeking, 'passive', 'planning')}% are passively exploring or planning to</strong>, and only{' '}
              {pct(seeking, 'active')}% are actively applying. The bench is quietly open — to whoever
              reaches it first. An RTO mandate doesn&apos;t relocate your team; it markets them.
            </p>
          </div>
        </Reveal>
      </section>

      {/* 05 · ladders */}
      <section>
        <Reveal>
          <div className="bf1-sec-head">
            <span className="bf1-sec-num">LIVE / 05</span>
            <h2>What seniority — and specialty — are worth.</h2>
          </div>
        </Reveal>
        <div className="bf1-split">
          <Reveal>
            <figure className="bf1-chart">
              <figcaption>Application Analyst · median by level</figcaption>
              <p className="bf1-chart-sub">National · live rungs</p>
              <div className="bf1-stairs">
                {rungs.map((r) => (
                  <div key={r.roleKey} className="bf1-stair">
                    <motion.div
                      className="bf1-stair-bar"
                      style={{ height: `${(r.blended.p50 / (rungs[rungs.length - 1]?.blended.p50 ?? 1)) * 100}%` }}
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], transformOrigin: 'bottom' } as never}
                    >
                      <span className="bf1-stair-v">{fmtK(r.blended.p50)}</span>
                    </motion.div>
                    <span className="bf1-stair-l">{r.seniority}</span>
                  </div>
                ))}
              </div>
              <p className="bf1-chart-note">The senior rungs are exactly where every employer is bidding.</p>
            </figure>
          </Reveal>
          <Reveal>
            <figure className="bf1-chart">
              <figcaption>Median by role family</figcaption>
              <p className="bf1-chart-sub">National · all seniorities · sorted live</p>
              <div className="bf1-hbars">
                {roleLadder.map((r, i) => (
                  <div key={r.roleKey} className={i === 0 ? 'bf1-hbar bf1-hot' : 'bf1-hbar'}>
                    <div className="bf1-hbar-lab">
                      <span>{r.roleName}</span>
                      <span className="bf1-hbar-v">{fmtK(r.blended.p50)}</span>
                    </div>
                    <div className="bf1-track">
                      <GrowBar className="bf1-fill" widthPct={(r.blended.p50 / maxMedian) * 100} delay={i * 0.05} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="bf1-chart-note">Director, VP, and C-suite benchmarks are call-only.</p>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* 06 · org-type slice */}
      <section>
        <Reveal>
          <div className="bf1-sec-head">
            <span className="bf1-sec-num">LIVE / 06</span>
            <h2>Who pays what: the org-type slice.</h2>
          </div>
        </Reveal>
        <Reveal>
          <p className="bf1-lede">
            The same title carries a different number at a children&apos;s hospital than at an academic
            medical center or an independent. Know your segment before you set the band — and know who
            you&apos;re bidding against when you post.
          </p>
        </Reveal>
        <Reveal><OrgSlice data={data} /></Reveal>
      </section>

      {/* 07 · AI + M&A */}
      <section>
        <Reveal>
          <div className="bf1-sec-head">
            <span className="bf1-sec-num">LIVE / 07</span>
            <h2>The two forces reshaping the org chart.</h2>
          </div>
        </Reveal>
        <div className="bf1-trend-grid">
          <Reveal>
            <div className="bf1-trend">
              <div className="bf1-trend-big"><Count to={pct(ai, 'no_impact', 'enhance')} suffix="%" /></div>
              <h3>AI: unafraid</h3>
              <p>
                expect AI to leave their role intact or enhance it; just {pct(ai, 'transform')}% expect
                fundamental change. {pct(aiOrg, 'have')}% of leaders already staff dedicated AI/ML people.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="bf1-trend">
              <div className="bf1-trend-big"><Count to={pct(ma, 'yes')} suffix="%" /></div>
              <h3>M&amp;A: a workforce event</h3>
              <p>
                went through a merger in the last 3 years; {pct(layoffs, 'yes')}% saw a RIF this year.
                Yet {pct(maStronger, 'yes')}% came out feeling professionally stronger.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="bf1-trend">
              <div className="bf1-trend-big bf1-copper"><Count to={pct(fair, 'no')} suffix="%" /></div>
              <h3>The quiet number</h3>
              <p>
                feel underpaid against this market. Every one of them can check the benchmark you&apos;re
                reading right now.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 07 · what keeps them */}
      <section>
        <Reveal>
          <div className="bf1-sec-head">
            <span className="bf1-sec-num">LIVE / 07</span>
            <h2>What actually keeps people.</h2>
          </div>
        </Reveal>
        <div className="bf1-trend-grid">
          <Reveal>
            <div className="bf1-trend">
              <div className="bf1-trend-big"><Count to={pct(wlb, 'satisfied')} suffix="%" /></div>
              <h3>Balance is up{wlbDelta != null && wlbDelta > 0 ? ` (+${wlbDelta} pts)` : ''}</h3>
              <p>satisfied with work-life balance. What they have, they will protect — see the RTO cliff above.</p>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="bf1-trend">
              <div className="bf1-trend-big"><Count to={pct(recognized, 'yes')} suffix="%" /></div>
              <h3>Recognition matters</h3>
              <p>feel their skills are recognized. The other {pct(recognized, 'no')}% answer thoughtful outreach.</p>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="bf1-trend">
              <div className="bf1-trend-big bf1-copper"><Count to={pct(mobility, 'unclear', 'blocked')} suffix="%" /></div>
              <h3>The growth gap</h3>
              <p>
                see no clear path up ({pct(mobility, 'unclear')}%) or are blocked waiting on a seat ({pct(mobility, 'blocked')}%).
                Show a real path and you stand out instantly.
              </p>
            </div>
          </Reveal>
        </div>
        <Reveal>
          <div className="bf1-aside">
            <p className="bf1-aside-t">What we do with this</p>
            <p>
              Pay opens the door; balance, recognition, and a visible path keep people inside it.
              That&apos;s the fit we screen for on both sides — priced to this benchmark, built to stay.
            </p>
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="bf1-cta-sec">
        <Reveal>
          <div className="bf1-cta">
            <p className="bf1-kicker" style={{ color: '#7FA08D' }}>Bloomforce · Healthcare IT talent. It&apos;s all we do.</p>
            <h2>Hire with the market, not against it.</h2>
            <p>
              This page reads from the same living benchmark our recruiters use. Bring us the seat
              you&apos;re trying to fill and we&apos;ll show you what it takes to win it — comp, structure, and
              the candidates actually in reach.
            </p>
            <div className="bf1-cta-row">
              <a className="bf1-btn bf1-btn-solid" href="https://www.bloomforce.com/book">Book a call</a>
              <a className="bf1-btn bf1-btn-ghost" href="/preview">Explore the full benchmark</a>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="bf1-foot">
        <div className="bf1-foot-rule">
          <p>
            <strong>Source:</strong> The Bloomforce Living EHR Talent Benchmark —{' '}
            {f.totalRespondents.toLocaleString()} survey respondents and{' '}
            {f.postingsIngested.toLocaleString()} job postings, {f.windowLabel}. Values on this page
            update automatically as new data lands.
          </p>
          <p style={{ marginTop: 10 }}>© {new Date(f.asOf).getFullYear()} Bloomforce · Westerville, OH · hello@bloomforce.com</p>
        </div>
      </footer>
    </div>
  );
}

const CSS = `
.bf1 {
  --bf1-paper: #F9FAF7; --bf1-deep: #F1F4EE; --bf1-ink: #14231D; --bf1-soft: #51625A;
  --bf1-faint: #8A968F; --bf1-green: #146B5A; --bf1-green-soft: #E3EEE9; --bf1-copper: #BC5427;
  --bf1-rule: #D9E0DA; --bf1-max: 1120px;
  background: var(--bf1-paper); color: var(--bf1-ink);
  font-family: var(--bf1-sans), sans-serif; font-size: 17px; line-height: 1.65;
}
.bf1 ::selection { background: var(--bf1-green); color: #fff; }
.bf1 a { color: inherit; }
.bf1 h1, .bf1 h2 { font-family: var(--bf1-serif), serif; font-weight: 400; letter-spacing: -0.012em; }
.bf1-serif-it { font-family: var(--bf1-serif), serif; font-style: italic; }
.bf1 strong { color: var(--bf1-ink); font-weight: 600; }

.bf1-live { position: sticky; top: 0; z-index: 60; display: flex; align-items: center; justify-content: center; gap: 10px;
  background: var(--bf1-ink); color: #C9D4CD; font-family: var(--bf1-mono), monospace; font-size: 11.5px;
  letter-spacing: .1em; text-transform: uppercase; padding: 8px 16px; text-align: center; }
.bf1-dot { width: 8px; height: 8px; border-radius: 50%; background: #57C79B; animation: bf1blink 2s infinite; flex-shrink: 0; }
@keyframes bf1blink { 0%,100% { opacity: 1; } 50% { opacity: .3; } }

.bf1-nav { position: sticky; top: 33px; z-index: 50; display: flex; align-items: center; justify-content: space-between;
  padding: 14px 32px; background: color-mix(in srgb, var(--bf1-paper) 88%, transparent);
  backdrop-filter: blur(10px); border-bottom: 1px solid var(--bf1-rule); }
.bf1-wordmark { font-family: var(--bf1-serif), serif; font-size: 21px; font-weight: 500; text-decoration: none; }
.bf1-wordmark em { font-style: italic; color: var(--bf1-green); }
.bf1-nav-r { display: flex; align-items: center; gap: 18px; }
.bf1 a.bf1-nav-link { font-size: 13.5px; font-weight: 600; text-decoration: none; color: var(--bf1-soft); }
.bf1 a.bf1-nav-link:hover { color: var(--bf1-green); }
.bf1 a.bf1-cta-pill { font-size: 13.5px; font-weight: 600; text-decoration: none; background: var(--bf1-ink); color: var(--bf1-paper);
  padding: 10px 20px; border-radius: 999px; transition: background .2s; }
.bf1 a.bf1-cta-pill:hover { background: var(--bf1-green); }

.bf1-hero { min-height: 88vh; display: flex; flex-direction: column; justify-content: center;
  max-width: var(--bf1-max); margin: 0 auto; padding: 90px 32px 60px; }
.bf1-kicker { font-family: var(--bf1-mono), monospace; font-size: 13px; letter-spacing: .16em; text-transform: uppercase;
  color: var(--bf1-green); margin-bottom: 26px; }
.bf1 h1 { font-size: clamp(40px, 6vw, 78px); line-height: 1.05; max-width: 17ch; }
.bf1-accent { font-style: italic; color: var(--bf1-green); }
.bf1-hero-sub { margin-top: 28px; max-width: 54ch; font-size: 19px; color: var(--bf1-soft); }
.bf1-hero-meta { margin-top: 46px; display: flex; gap: 36px; flex-wrap: wrap; font-family: var(--bf1-mono), monospace;
  font-size: 12.5px; color: var(--bf1-faint); text-transform: uppercase; letter-spacing: .1em; }
.bf1-scroll-cue { margin-top: 54px; font-family: var(--bf1-mono), monospace; font-size: 12px; letter-spacing: .14em;
  text-transform: uppercase; color: var(--bf1-faint); }

.bf1-ticker { overflow: hidden; border-top: 1px solid var(--bf1-rule); border-bottom: 1px solid var(--bf1-rule); background: #fff; }
.bf1-ticker-track { display: inline-flex; gap: 44px; padding: 13px 0; white-space: nowrap; animation: bf1marquee 46s linear infinite; }
@media (prefers-reduced-motion: reduce) { .bf1-ticker-track { animation: none; } }
@keyframes bf1marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.bf1-pulse { font-family: var(--bf1-mono), monospace; font-size: 12.5px; color: var(--bf1-soft); display: inline-flex; align-items: center; gap: 9px; }
.bf1-pk { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }
.bf1-pk-benchmark_move { background: var(--bf1-green); }
.bf1-pk-demand_shift { background: var(--bf1-copper); }
.bf1-pk-new_data { background: #7C9CC4; }
.bf1-pk-industry_news { background: var(--bf1-faint); }

.bf1 section { max-width: var(--bf1-max); margin: 0 auto; padding: 100px 32px; }
.bf1-sec-head { display: grid; grid-template-columns: 90px 1fr; gap: 28px; align-items: baseline;
  border-top: 1px solid var(--bf1-rule); padding-top: 26px; margin-bottom: 44px; }
.bf1-sec-num { font-family: var(--bf1-mono), monospace; font-size: 13px; color: var(--bf1-green); letter-spacing: .12em; }
.bf1 h2 { font-size: clamp(30px, 4vw, 46px); line-height: 1.12; max-width: 24ch; }
.bf1-lede { font-size: 19px; color: var(--bf1-soft); max-width: 58ch; margin-bottom: 20px; }
.bf1-copy { max-width: 58ch; color: var(--bf1-soft); margin-bottom: 18px; }
.bf1-split { display: grid; grid-template-columns: minmax(0,5fr) minmax(0,6fr); gap: 64px; align-items: start; }
.bf1-rev { grid-template-columns: minmax(0,6fr) minmax(0,5fr); }
@media (max-width: 900px) { .bf1-split, .bf1-rev { grid-template-columns: 1fr; gap: 40px; } .bf1-sec-head { grid-template-columns: 1fr; gap: 8px; } }

.bf1-chart { background: #fff; border: 1px solid var(--bf1-rule); border-radius: 14px; padding: 30px 30px 24px; }
.bf1-chart figcaption { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.bf1-chart-sub { font-size: 12.5px; color: var(--bf1-faint); margin-bottom: 22px; }
.bf1-chart-note { margin-top: 16px; font-size: 12px; color: var(--bf1-faint); }

.bf1-pull { border-left: 3px solid var(--bf1-green); padding: 6px 0 6px 28px; margin: 34px 0; }
.bf1-pull-big { font-family: var(--bf1-serif), serif; font-size: clamp(44px, 5vw, 64px); line-height: 1;
  color: var(--bf1-green); font-variant-numeric: tabular-nums; }
.bf1-pull-label { font-size: 14px; color: var(--bf1-soft); margin-top: 8px; max-width: 38ch; }

.bf1-rail-wrap { padding: 26px 6px 8px; }
.bf1-rail { position: relative; height: 10px; border-radius: 999px; background: var(--bf1-deep); margin: 58px 0 34px; }
.bf1-band { position: absolute; top: 0; bottom: 0; border-radius: 999px; background: var(--bf1-green-soft); border: 1px solid #BFD9CF; }
.bf1-tick { position: absolute; top: 50%; width: 3px; height: 26px; transform: translate(-50%, -50%);
  border-radius: 2px; background: var(--bf1-green); }
.bf1-tick-med { height: 38px; width: 4px; background: var(--bf1-copper); }
.bf1-tick-label { position: absolute; top: -46px; left: 50%; transform: translateX(-50%);
  font-family: var(--bf1-mono), monospace; font-size: 12px; color: var(--bf1-soft); white-space: nowrap; text-align: center; }
.bf1-tick-label b { display: block; color: var(--bf1-ink); font-weight: 500; }
.bf1-end { position: absolute; top: 22px; font-family: var(--bf1-mono), monospace; font-size: 11.5px; color: var(--bf1-faint); }
.bf1-spark { width: 100%; height: 36px; margin-top: 8px; opacity: .8; }

.bf1-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.bf1-chips-sub { margin-bottom: 24px; }
.bf1-chip { font-family: var(--bf1-sans), sans-serif; font-size: 13px; font-weight: 600; color: var(--bf1-soft);
  background: var(--bf1-deep); border: 1px solid var(--bf1-rule); border-radius: 999px; padding: 8px 15px; cursor: pointer; transition: all .15s; }
.bf1-chip:hover { border-color: var(--bf1-green); color: var(--bf1-green); }
.bf1-chip-on { background: var(--bf1-green); border-color: var(--bf1-green); color: #fff; }
.bf1-chip-on:hover { color: #fff; }
.bf1-exp-read { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; flex-wrap: wrap; margin: 6px 0 0; }
.bf1-exp-med { font-family: var(--bf1-serif), serif; font-size: clamp(40px, 4.4vw, 56px); line-height: 1; color: var(--bf1-ink); }
.bf1-exp-medlab { display: block; font-size: 12.5px; color: var(--bf1-faint); margin-top: 6px; }
.bf1-exp-meta { display: flex; gap: 16px; align-items: center; font-family: var(--bf1-mono), monospace; font-size: 12px; color: var(--bf1-soft); flex-wrap: wrap; }
.bf1-delta { font-weight: 500; }
.bf1-delta.up { color: var(--bf1-green); }
.bf1-delta.down { color: var(--bf1-copper); }
.bf1-conf { border: 1px solid var(--bf1-rule); border-radius: 999px; padding: 3px 10px; text-transform: uppercase; letter-spacing: .08em; font-size: 10.5px; }

.bf1-hbars { display: grid; gap: 18px; padding: 8px 6px 0; }
.bf1-hbar-lab { display: flex; justify-content: space-between; font-size: 13.5px; margin-bottom: 7px; gap: 12px; }
.bf1-hbar-v { font-family: var(--bf1-mono), monospace; color: var(--bf1-ink); white-space: nowrap; }
.bf1-track { height: 14px; border-radius: 4px; background: var(--bf1-deep); overflow: hidden; }
.bf1-fill { height: 100%; border-radius: 4px 3px 3px 4px; background: var(--bf1-green); }
.bf1-hot .bf1-fill { background: var(--bf1-copper); }
.bf1-fill-soft { opacity: .45; }
.bf1-modeled { font-style: normal; color: var(--bf1-faint); font-size: 12px; }
.bf1-n { font-style: normal; color: var(--bf1-faint); font-size: 11px; margin-left: 6px; }
.bf1-delta-line { margin-top: 18px; font-family: var(--bf1-serif), serif; font-style: italic; font-size: 19px; color: var(--bf1-copper); }

.bf1-stack { display: flex; height: 46px; border-radius: 10px; overflow: hidden; margin: 10px 6px 0; }
.bf1-stack > div { display: flex; align-items: center; justify-content: center; font-family: var(--bf1-mono), monospace; font-size: 13px; color: #fff; }
.bf1-seg-look { background: var(--bf1-copper); }
.bf1-seg-negotiate { background: var(--bf1-green); }
.bf1-seg-comply { background: #9DB3AA; }
.bf1-legend { display: flex; gap: 22px; margin-top: 16px; font-size: 13px; color: var(--bf1-soft); flex-wrap: wrap; padding: 0 6px; }
.bf1-legend i { width: 11px; height: 11px; border-radius: 3px; display: inline-block; margin-right: 7px; }

.bf1-stairs { display: flex; align-items: flex-end; gap: 4%; height: 220px; padding: 0 6px; border-bottom: 1px solid var(--bf1-rule); }
.bf1-stair { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }
.bf1-stair-bar { width: 100%; max-width: 110px; background: var(--bf1-green); border-radius: 5px 5px 0 0; position: relative; }
.bf1-stair-v { position: absolute; top: -28px; left: 50%; transform: translateX(-50%);
  font-family: var(--bf1-mono), monospace; font-size: 13px; color: var(--bf1-ink); white-space: nowrap; }
.bf1-stair-l { margin-top: 10px; font-family: var(--bf1-mono), monospace; font-size: 12px; color: var(--bf1-faint); }

.bf1-trend-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
@media (max-width: 880px) { .bf1-trend-grid { grid-template-columns: 1fr; } }
.bf1-trend { background: #fff; border: 1px solid var(--bf1-rule); border-radius: 14px; padding: 28px 26px; height: 100%; }
.bf1-trend-big { font-family: var(--bf1-serif), serif; font-size: clamp(36px, 3.6vw, 48px); color: var(--bf1-green);
  line-height: 1; font-variant-numeric: tabular-nums; }
.bf1-copper { color: var(--bf1-copper) !important; }
.bf1-trend h3 { font-size: 15px; font-weight: 600; margin: 10px 0 6px; font-family: var(--bf1-sans), sans-serif; }
.bf1-trend p { font-size: 13.5px; color: var(--bf1-soft); }

.bf1-aside { background: var(--bf1-deep); border: 1px solid var(--bf1-rule); border-radius: 14px;
  padding: 26px 30px; margin-top: 44px; max-width: 760px; }
.bf1-aside p { font-size: 15px; color: var(--bf1-soft); }
.bf1-aside-t { font-family: var(--bf1-mono), monospace; font-size: 11px; letter-spacing: .16em;
  text-transform: uppercase; color: var(--bf1-copper); margin-bottom: 10px; }

.bf1-cta-sec { padding-left: 0 !important; padding-right: 0 !important; }
.bf1-cta { background: var(--bf1-ink); color: var(--bf1-paper); border-radius: 20px; margin: 0 32px;
  padding: 90px 64px; max-width: var(--bf1-max); }
@media (min-width: 1184px) { .bf1-cta { margin: 0 auto; } }
@media (max-width: 700px) { .bf1-cta { padding: 60px 30px; } }
.bf1-cta h2 { color: var(--bf1-paper); max-width: 20ch; }
.bf1-cta p { color: #B9C4BD; max-width: 54ch; margin-top: 18px; }
.bf1-cta-row { display: flex; gap: 16px; margin-top: 40px; flex-wrap: wrap; }
.bf1 a.bf1-btn { font-size: 15px; font-weight: 600; text-decoration: none; padding: 15px 30px; border-radius: 999px; transition: transform .15s, background .2s; display: inline-block; }
.bf1 a.bf1-btn:hover { transform: translateY(-2px); }
.bf1 a.bf1-btn-solid { background: var(--bf1-paper); color: var(--bf1-ink); }
.bf1 a.bf1-btn-ghost { border: 1px solid #4A5A52; color: var(--bf1-paper); }
.bf1 a.bf1-btn-ghost:hover { border-color: var(--bf1-paper); }

.bf1-foot { max-width: var(--bf1-max); margin: 0 auto; padding: 70px 32px 50px; font-size: 12.5px; color: var(--bf1-faint); line-height: 1.8; }
.bf1-foot-rule { border-top: 1px solid var(--bf1-rule); padding-top: 26px; }
.bf1-foot strong { color: var(--bf1-soft); }
`;
