'use client';

/**
 * "Mutual Fit, By the Numbers" — warm botanical scrollytelling homepage
 * candidate, rendered from the live benchmark. Unlisted at /preview/fit.
 */

import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Fraunces, Karla } from 'next/font/google';
import type { InsightsData } from '@/lib/insights/types';
import { Count, GrowBar, Reveal, cut, fmtK, overall, pct, pctDelta } from './shared';

const serif = Fraunces({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--bf3-serif' });
const sans = Karla({ subsets: ['latin'], variable: '--bf3-sans' });

function Vine() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });
  const nodeAts = [0.16, 0.36, 0.56, 0.76, 0.95];
  return (
    <div className="bf3-vine" aria-hidden="true">
      <svg viewBox="0 0 40 1000" preserveAspectRatio="none">
        <path
          className="bf3-vine-track"
          d="M20 0 C 30 80, 10 160, 20 240 C 30 320, 10 400, 20 480 C 30 560, 10 640, 20 720 C 30 800, 10 880, 20 1000"
        />
        <motion.path
          className="bf3-vine-path"
          d="M20 0 C 30 80, 10 160, 20 240 C 30 320, 10 400, 20 480 C 30 560, 10 640, 20 720 C 30 800, 10 880, 20 1000"
          style={{ pathLength: progress }}
        />
        {nodeAts.map((at, i) => (
          <VineNode key={at} at={at} progress={progress} last={i === nodeAts.length - 1} />
        ))}
      </svg>
    </div>
  );
}

function VineNode({
  at,
  progress,
  last,
}: {
  at: number;
  progress: ReturnType<typeof useSpring>;
  last: boolean;
}) {
  const scale = useTransform(progress, [at - 0.015, at + 0.015], [0, 1]);
  return (
    <motion.circle
      cx={20}
      cy={at * 1000}
      r={last ? 8 : 5}
      fill={last ? 'var(--bf3-blossom)' : 'var(--bf3-leaf)'}
      style={{ scale, transformOrigin: `20px ${at * 1000}px` } as never}
    />
  );
}

function Venn() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'start 0.3'] });
  const xa = useTransform(scrollYProgress, [0, 1], [-95, 0]);
  const xb = useTransform(scrollYProgress, [0, 1], [95, 0]);
  const fit = useTransform(scrollYProgress, [0.85, 1], [0, 1]);
  return (
    <div className="bf3-venn-box" ref={ref}>
      <svg viewBox="0 0 640 360" style={{ overflow: 'visible' }} role="img"
        aria-label="Venn diagram: what they want and what you offer slide together; the overlap is mutual fit.">
        <motion.g style={{ x: xa }}>
          <circle className="bf3-circ" cx="230" cy="180" r="130" fill="var(--bf3-blossom)" stroke="var(--bf3-blossom)" />
          <text className="bf3-vl" x="180" y="172" textAnchor="middle">What they want</text>
          <text className="bf3-vs" x="180" y="192" textAnchor="middle">flexibility · balance · a path · fair pay</text>
        </motion.g>
        <motion.g style={{ x: xb }}>
          <circle className="bf3-circ" cx="410" cy="180" r="130" fill="var(--bf3-leaf)" stroke="var(--bf3-leaf)" />
          <text className="bf3-vl" x="462" y="172" textAnchor="middle">What you offer</text>
          <text className="bf3-vs" x="462" y="192" textAnchor="middle">real scope · honest band · stability</text>
        </motion.g>
        <motion.g style={{ opacity: fit }}>
          <text className="bf3-vl bf3-vl-fit" x="320" y="174" textAnchor="middle">Mutual</text>
          <text className="bf3-vl bf3-vl-fit" x="320" y="194" textAnchor="middle">fit</text>
        </motion.g>
      </svg>
    </div>
  );
}

export function FitScrolly({ data }: { data: InsightsData }) {
  const f = data.freshness;
  const aa = overall(data, 'AA');
  const remote = data.workModels.find((w) => w.workModel === 'remote');
  const onsite = data.workModels.find((w) => w.workModel === 'onsite');
  const premium =
    remote?.median != null && onsite?.median != null ? remote.median - onsite.median : null;

  const rto = cut(data, 'rto_response');
  const wlb = cut(data, 'satisfaction_wlb');
  const mobility = cut(data, 'mobility_role');
  const fair = cut(data, 'fair_comp');
  const ai = cut(data, 'ai_impact');
  const recognized = cut(data, 'recognized');
  const seeking = cut(data, 'job_seeking');

  const resist = pct(rto, 'look', 'negotiate');
  const wlbSat = pct(wlb, 'satisfied');
  const wlbDelta = pctDelta(wlb, 'satisfied');
  const pathGap = pct(mobility, 'unclear', 'blocked');
  const aiPos = pct(ai, 'no_impact', 'enhance');
  const underpaid = pct(fair, 'no');
  const rec = pct(recognized, 'yes');
  const quietlyOpen = pct(seeking, 'passive', 'planning');

  const wants = [
    {
      cls: 'bf3-rose',
      v: resist,
      title: 'Flexibility is non-negotiable',
      copy: `would negotiate or leave over a return-to-office mandate — ${pct(rto, 'look')}% would start job-hunting outright. Only ${pct(rto, 'comply')}% would comply.`,
    },
    {
      cls: '',
      v: wlbSat,
      title: 'Balance they can keep',
      copy: `satisfied with work-life balance${wlbDelta != null && wlbDelta > 0 ? ` — up ${wlbDelta} points year over year` : ''}. An offer that threatens it starts underwater.`,
    },
    {
      cls: 'bf3-honey',
      v: pathGap,
      title: 'A path they can see',
      copy: `can't see a clear road up: ${pct(mobility, 'unclear')}% say there's no path, ${pct(mobility, 'blocked')}% are blocked waiting on a seat. Show a real one and you stand apart.`,
    },
    {
      cls: '',
      v: aiPos,
      title: 'A future with AI, not against it',
      copy: `expect AI to leave their role intact or make it better. The curious ones want somewhere to build.`,
    },
    {
      cls: 'bf3-rose',
      v: underpaid,
      title: 'A number that feels honest',
      copy: `feel underpaid against this market — and the live benchmark makes it easy to check. An honest band is a recruiting advantage now.`,
    },
  ];

  return (
    <div className={`bf3 ${serif.variable} ${sans.variable}`}>
      <style>{CSS}</style>
      <Vine />

      <nav className="bf3-nav">
        <a className="bf3-wordmark" href="#top">bloomforce<span>.</span></a>
        <div className="bf3-nav-r">
          <a className="bf3-nav-link" href="/preview">Full benchmark →</a>
          <a className="bf3-cta-pill" href="https://www.bloomforce.com/book">Book a call</a>
        </div>
      </nav>

      <header className="bf3-hero" id="top">
        <Reveal>
          <p className="bf3-eyebrow">
            Bloomforce · live from {f.totalRespondents.toLocaleString()} healthcare IT professionals
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <h1>We asked your next hire what would make them <em>stay.</em></h1>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="bf3-hero-sub">
            Our living benchmark listens continuously — survey responses and job postings, refreshed
            as they land ({f.windowLabel}). This is what the people who run Epic told us they want,
            and how we use it to make placements that hold.
          </p>
        </Reveal>
        <p className="bf3-scroll-cue">See what they said ↓</p>
      </header>

      {/* soil */}
      <section>
        <Reveal><p className="bf3-eyebrow">The soil · live market conditions</p></Reveal>
        <Reveal><h2>First, know the ground you&apos;re planting in.</h2></Reveal>
        <div className="bf3-stat-row">
          <Reveal>
            <div className="bf3-stat">
              <div className="bf3-stat-v"><Count to={(aa?.blended.p50 ?? 0) / 1000} prefix="$" suffix="K" /></div>
              <p>
                national median for an Application Analyst — the middle half runs{' '}
                {fmtK(aa?.blended.p25)}–{fmtK(aa?.blended.p75)}, so an old band loses quietly.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="bf3-stat bf3-s-rose">
              <div className="bf3-stat-v"><Count to={Math.round((remote?.share ?? 0) * 100)} suffix="%" /></div>
              <p>
                work fully remote
                {premium != null && premium > 0 ? (
                  <> — and remote clears on-site by <strong>{fmtK(premium)}</strong> at the median. Location is comp now.</>
                ) : (
                  '.'
                )}
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="bf3-stat bf3-s-honey">
              <div className="bf3-stat-v"><Count to={wlbSat} suffix="%" /></div>
              <p>
                satisfied with their work-life balance
                {wlbDelta != null && wlbDelta > 0 ? ` — up ${wlbDelta} points year over year` : ''}. What
                they have, they will protect.
              </p>
            </div>
          </Reveal>
        </div>
        <Reveal>
          <p className="bf3-src">
            Live values from the Bloomforce benchmark · {f.totalRespondents.toLocaleString()} respondents ·{' '}
            {f.postingsIngested.toLocaleString()} postings · {f.windowLabel}
          </p>
        </Reveal>
      </section>

      {/* wants */}
      <section>
        <Reveal><p className="bf3-eyebrow">The roots · what they told us</p></Reveal>
        <Reveal><h2>Five things this workforce actually wants.</h2></Reveal>
        <Reveal><p className="bf3-lede">Not guesses — their own answers, straight from the live data.</p></Reveal>
        <div className="bf3-wants">
          {wants.map((w, i) => (
            <Reveal key={w.title} delay={i * 0.04}>
              <div className={`bf3-want ${w.cls}`}>
                <div className="bf3-want-pct"><Count to={w.v} suffix="%" /></div>
                <div>
                  <h3>{w.title}</h3>
                  <p>{w.copy}</p>
                  <div className="bf3-want-track"><GrowBar className="bf3-want-fill" widthPct={w.v} /></div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* two people */}
      <section>
        <Reveal><p className="bf3-eyebrow">Two great résumés, two different roots</p></Reveal>
        <Reveal><h2>The data explains both of them.</h2></Reveal>
        <Reveal>
          <p className="bf3-lede">
            {premium != null && premium > 0
              ? `A ${fmtK(premium)} remote premium explains the offer-chaser. `
              : ''}
            A {pathGap}% growth gap explains the builder. Both are rational. Only one is right for the
            seat you&apos;re filling.
          </p>
        </Reveal>
        <div className="bf3-people">
          <Reveal>
            <div className="bf3-person">
              <span className="bf3-badge">Candidate A</span>
              <h3>The offer-chaser</h3>
              <p className="bf3-role">Epic Analyst · 9 years · flawless certs</p>
              <ul>
                <li>Rides the premium — every rate call gets a callback</li>
                <li>The market keeps re-pricing them upward, and they know it</li>
                <li>Right choice for a defined go-live surge</li>
                <li>Risky choice for a three-year roadmap</li>
              </ul>
              <p className="bf3-note">
                The market made this person. You can&apos;t out-bid it forever — someone will always print a
                bigger number.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="bf3-person bf3-builder">
              <span className="bf3-badge">Candidate B</span>
              <h3>The builder</h3>
              <p className="bf3-role">Epic Analyst · 8 years · strong certs</p>
              <ul>
                <li>In the {pathGap}% who can&apos;t see a growth path where they are</li>
                <li>Protective of balance — and loyal to whoever provides it</li>
                <li>Wants to build with AI, not watch it happen</li>
                <li>Moves once, for the right reasons, and stays</li>
              </ul>
              <p className="bf3-note">
                The live data says they exist everywhere: {quietlyOpen}% of the workforce is passively
                exploring or planning to — only {pct(seeking, 'active')}% actively applying.
              </p>
            </div>
          </Reveal>
        </div>
        <Reveal>
          <p className="bf3-honest">
            Skills tell you who <strong>can</strong> do the job. The benchmark tells us what makes them{' '}
            <em>stay in it.</em> We screen for both — on both sides of the table.
          </p>
        </Reveal>
      </section>

      {/* venn */}
      <section className="bf3-center">
        <Reveal><p className="bf3-eyebrow">What &ldquo;mutual&rdquo; actually means</p></Reveal>
        <Reveal><h2>Fit isn&apos;t a filter. It&apos;s an <em>overlap.</em></h2></Reveal>
        <Reveal>
          <p className="bf3-lede">
            We qualify both sides — what the candidate genuinely wants (now you know), and what the
            role genuinely offers. Where they overlap, placements last.
          </p>
        </Reveal>
        <Venn />
        <Reveal>
          <div className="bf3-fit-list">
            <span>Remote-first, or a reason that isn&apos;t a memo <b>· {resist}%</b></span>
            <span>A band set to the live benchmark <b>· {fmtK(aa?.blended.p50)} median</b></span>
            <span>A visible growth path <b>· the {pathGap}% gap</b></span>
            <span>Work that uses their AI curiosity <b>· {aiPos}%</b></span>
            <span>Recognition <b>· {100 - rec}% aren&apos;t getting it</b></span>
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="bf3-cta-sec">
        <Reveal><h2>Two ways to grow from here.</h2></Reveal>
        <div className="bf3-cta-grid">
          <Reveal>
            <div className="bf3-cta-card bf3-client">
              <p className="bf3-eyebrow" style={{ color: '#9DB68A', margin: 0 }}>For health systems</p>
              <h3>Make your next offer with the data behind it.</h3>
              <p>
                Bring us the seat. We&apos;ll benchmark it live, tell you what it takes to win in this
                market, and introduce the people built to stay.
              </p>
              <a className="bf3-btn bf3-btn-light" href="https://www.bloomforce.com/book">Book a call</a>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="bf3-cta-card bf3-talent">
              <p className="bf3-eyebrow" style={{ margin: 0 }}>For candidates</p>
              <h3>See where you stand — right now.</h3>
              <p>
                Compare your comp and your ceiling against the live benchmark — and if the numbers say
                you&apos;re due for more, let&apos;s talk.
              </p>
              <a className="bf3-btn bf3-btn-green" href="/preview">Explore the benchmark</a>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="bf3-foot">
        <div>
          <p>
            <strong>Source:</strong> The Bloomforce Living EHR Talent Benchmark —{' '}
            {f.totalRespondents.toLocaleString()} respondents, {f.postingsIngested.toLocaleString()} postings,{' '}
            {f.windowLabel}. Values on this page update automatically. Candidate profiles are
            illustrative composites grounded in the data.
          </p>
          <p style={{ marginTop: 8 }}>
            © {new Date(f.asOf).getFullYear()} Bloomforce · Westerville, OH · hello@bloomforce.com · +1 614 385 0909
          </p>
        </div>
      </footer>
    </div>
  );
}

const CSS = `
.bf3 {
  --bf3-bg: #F4F6EF; --bf3-deep: #EAEEE0; --bf3-card: #FDFDFA; --bf3-ink: #22301F;
  --bf3-soft: #58684F; --bf3-faint: #8D9A82; --bf3-leaf: #4F7259; --bf3-deep-leaf: #33502F;
  --bf3-blossom: #A9506B; --bf3-honey: #C99532; --bf3-line: #D8DFC9; --bf3-max: 1080px;
  background: var(--bf3-bg); color: var(--bf3-ink);
  font-family: var(--bf3-sans), sans-serif; font-size: 17px; line-height: 1.65; overflow-x: hidden;
}
.bf3 ::selection { background: var(--bf3-blossom); color: #fff; }
.bf3 a { color: inherit; }
.bf3 h1, .bf3 h2, .bf3 h3 { font-family: var(--bf3-serif), serif; font-weight: 500; letter-spacing: -0.01em; }
.bf3 h1 em, .bf3 h2 em { font-style: italic; color: var(--bf3-blossom); font-weight: 400; }
.bf3 h2 em { color: var(--bf3-leaf); }
.bf3 strong { color: var(--bf3-ink); font-weight: 700; }

.bf3-vine { position: fixed; top: 0; bottom: 0; left: 22px; width: 40px; z-index: 30; pointer-events: none; }
.bf3-vine svg { height: 100%; width: 100%; overflow: visible; }
.bf3-vine-track { stroke: var(--bf3-line); stroke-width: 2.2; fill: none; }
.bf3-vine-path { stroke: var(--bf3-leaf); stroke-width: 2.2; fill: none; stroke-linecap: round; }
@media (max-width: 1100px) { .bf3-vine { display: none; } }

.bf3-nav { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; justify-content: space-between;
  padding: 16px 32px; background: color-mix(in srgb, var(--bf3-bg) 86%, transparent);
  backdrop-filter: blur(10px); border-bottom: 1px solid var(--bf3-line); }
.bf3-wordmark { font-family: var(--bf3-serif), serif; font-size: 22px; font-weight: 600; text-decoration: none; }
.bf3-wordmark span { color: var(--bf3-blossom); }
.bf3-nav-r { display: flex; align-items: center; gap: 18px; }
.bf3 a.bf3-nav-link { font-size: 13.5px; font-weight: 700; text-decoration: none; color: var(--bf3-soft); }
.bf3 a.bf3-nav-link:hover { color: var(--bf3-leaf); }
.bf3 a.bf3-cta-pill { font-size: 14px; font-weight: 700; text-decoration: none; background: var(--bf3-deep-leaf);
  color: #F4F6EF; padding: 10px 22px; border-radius: 999px; transition: background .2s; }
.bf3 a.bf3-cta-pill:hover { background: var(--bf3-blossom); }

.bf3-hero { min-height: 92vh; display: flex; flex-direction: column; justify-content: center; align-items: center;
  text-align: center; padding: 120px 28px 80px; position: relative; }
.bf3-eyebrow { font-size: 13px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase;
  color: var(--bf3-leaf); margin-bottom: 24px; }
.bf3 h1 { font-size: clamp(40px, 6.4vw, 82px); line-height: 1.03; max-width: 18ch; }
.bf3-hero-sub { margin-top: 28px; font-size: 19px; color: var(--bf3-soft); max-width: 56ch; }
.bf3-scroll-cue { position: absolute; bottom: 36px; font-size: 12px; font-weight: 700; letter-spacing: .18em;
  text-transform: uppercase; color: var(--bf3-faint); }

.bf3 section { max-width: var(--bf3-max); margin: 0 auto; padding: 105px 28px; }
.bf3 h2 { font-size: clamp(30px, 4.2vw, 50px); line-height: 1.1; max-width: 26ch; }
.bf3-lede { font-size: 19px; color: var(--bf3-soft); max-width: 58ch; margin-top: 20px; }
.bf3-center { text-align: center; }
.bf3-center h2, .bf3-center .bf3-lede { margin-left: auto; margin-right: auto; }
.bf3-src { margin-top: 26px; font-size: 12.5px; color: var(--bf3-faint); }

.bf3-stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 52px; }
@media (max-width: 860px) { .bf3-stat-row { grid-template-columns: 1fr; } }
.bf3-stat { background: var(--bf3-card); border: 1px solid var(--bf3-line); border-radius: 18px;
  padding: 32px 28px; position: relative; overflow: hidden; height: 100%; }
.bf3-stat::after { content: ""; position: absolute; left: 28px; right: 28px; bottom: 0; height: 3px;
  border-radius: 3px 3px 0 0; background: var(--bf3-leaf); }
.bf3-s-rose::after { background: var(--bf3-blossom); }
.bf3-s-honey::after { background: var(--bf3-honey); }
.bf3-stat-v { font-family: var(--bf3-serif), serif; font-size: clamp(40px, 4.4vw, 56px); line-height: 1; font-variant-numeric: tabular-nums; }
.bf3-stat p { margin-top: 12px; font-size: 14px; color: var(--bf3-soft); }

.bf3-wants { display: grid; gap: 16px; margin-top: 52px; max-width: 860px; }
.bf3-want { background: var(--bf3-card); border: 1px solid var(--bf3-line); border-radius: 16px;
  padding: 26px 28px; display: grid; grid-template-columns: 130px 1fr; gap: 24px; align-items: center; }
@media (max-width: 700px) { .bf3-want { grid-template-columns: 1fr; gap: 12px; } }
.bf3-want-pct { font-family: var(--bf3-serif), serif; font-size: clamp(36px, 3.6vw, 48px);
  color: var(--bf3-leaf); line-height: 1; font-variant-numeric: tabular-nums; }
.bf3-rose .bf3-want-pct { color: var(--bf3-blossom); }
.bf3-honey .bf3-want-pct { color: var(--bf3-honey); }
.bf3-want h3 { font-size: 20px; font-weight: 600; margin-bottom: 6px; }
.bf3-want p { font-size: 14.5px; color: var(--bf3-soft); max-width: 58ch; }
.bf3-want-track { height: 7px; border-radius: 999px; background: var(--bf3-deep); overflow: hidden; margin-top: 14px; }
.bf3-want-fill { height: 100%; border-radius: 999px; background: var(--bf3-leaf); }
.bf3-rose .bf3-want-fill { background: var(--bf3-blossom); }
.bf3-honey .bf3-want-fill { background: var(--bf3-honey); }

.bf3-people { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 56px; }
@media (max-width: 820px) { .bf3-people { grid-template-columns: 1fr; } }
.bf3-person { background: var(--bf3-card); border: 1px solid var(--bf3-line); border-radius: 22px;
  padding: 36px 32px; position: relative; height: 100%; }
.bf3-builder { border-color: var(--bf3-leaf); box-shadow: 0 12px 40px -18px rgba(51,80,47,.35); }
.bf3-badge { position: absolute; top: -13px; left: 30px; font-size: 11px; font-weight: 700;
  letter-spacing: .14em; text-transform: uppercase; background: var(--bf3-blossom); color: #fff;
  padding: 5px 12px; border-radius: 999px; }
.bf3-builder .bf3-badge { background: var(--bf3-deep-leaf); }
.bf3-person h3 { font-size: 26px; margin-bottom: 4px; }
.bf3-role { font-size: 13.5px; color: var(--bf3-faint); margin-bottom: 22px; }
.bf3-person ul { list-style: none; display: grid; gap: 12px; font-size: 15px; color: var(--bf3-soft); padding: 0; }
.bf3-person li { padding-left: 24px; position: relative; }
.bf3-person li::before { content: "—"; position: absolute; left: 0; color: var(--bf3-blossom); }
.bf3-builder li::before { content: "✓"; color: var(--bf3-leaf); }
.bf3-note { margin-top: 22px; padding-top: 18px; border-top: 1px dashed var(--bf3-line);
  font-size: 14px; color: var(--bf3-soft); font-style: italic; }
.bf3-honest { margin-top: 44px; font-family: var(--bf3-serif), serif; font-size: clamp(21px, 2.6vw, 28px);
  font-weight: 400; line-height: 1.4; max-width: 46ch; }
.bf3-honest em { font-style: italic; color: var(--bf3-blossom); }

.bf3-venn-box { margin: 40px auto 0; max-width: 640px; }
.bf3-circ { fill-opacity: 0.16; stroke-width: 2; }
.bf3-vl { font-family: var(--bf3-sans), sans-serif; font-size: 14px; font-weight: 700; fill: var(--bf3-ink); }
.bf3-vl-fit { fill: var(--bf3-deep-leaf); font-size: 16px; }
.bf3-vs { font-family: var(--bf3-sans), sans-serif; font-size: 11px; fill: var(--bf3-faint); }
.bf3-fit-list { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 34px; }
.bf3-fit-list span { font-size: 13.5px; font-weight: 600; color: var(--bf3-deep-leaf); background: #E7EEE2;
  border: 1px solid #CBD9C4; border-radius: 999px; padding: 8px 16px; }
.bf3-fit-list b { color: var(--bf3-blossom); }

.bf3-cta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 52px; }
@media (max-width: 820px) { .bf3-cta-grid { grid-template-columns: 1fr; } }
.bf3-cta-card { border-radius: 24px; padding: 44px 38px; display: flex; flex-direction: column;
  gap: 14px; align-items: flex-start; height: 100%; }
.bf3-client { background: var(--bf3-deep-leaf); color: #F0F4E8; }
.bf3-client h3 { color: #fff; }
.bf3-talent { background: var(--bf3-card); border: 1px solid var(--bf3-line); }
.bf3-cta-card h3 { font-size: 28px; line-height: 1.15; }
.bf3-client p { color: #C6D2B8; font-size: 15px; max-width: 42ch; }
.bf3-talent p { color: var(--bf3-soft); font-size: 15px; max-width: 42ch; }
.bf3 a.bf3-btn { margin-top: 12px; font-size: 15px; font-weight: 700; text-decoration: none;
  padding: 14px 28px; border-radius: 999px; transition: transform .15s, background .2s; display: inline-block; }
.bf3 a.bf3-btn:hover { transform: translateY(-2px); }
.bf3 a.bf3-btn-light { background: #F4F6EF; color: var(--bf3-deep-leaf); }
.bf3 a.bf3-btn-green { background: var(--bf3-deep-leaf); color: #F4F6EF; }
.bf3 a.bf3-btn-green:hover, .bf3 a.bf3-btn-light:hover { background: var(--bf3-blossom); color: #fff; }

.bf3-foot { border-top: 1px solid var(--bf3-line); padding: 50px 28px 60px; font-size: 12.5px;
  color: var(--bf3-faint); line-height: 1.8; }
.bf3-foot > div { max-width: var(--bf3-max); margin: 0 auto; }
.bf3-foot strong { color: var(--bf3-soft); }
`;
