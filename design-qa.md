# Design QA

## Market Explorer

- [x] Desktop layout verified at 1440px with stable two-column dashboard composition.
- [x] Mobile layout verified at 390px with no horizontal page overflow.
- [x] Role, level, region, work model, and organization type controls fit their containers.
- [x] Work-model and organization-type cuts display sample size and confidence context.
- [x] Empty published-cut combinations fall back visibly instead of presenting invented precision.
- [x] Operational typography remains compact and readable across light and dark surfaces.

## Data Operations

- [x] Existing live survey records and processing tables remain available.
- [x] CSV, API, and webhook intake paths are represented in the v1 source workflow.
- [x] Organization matching supports search, row selection, bulk type assignment, and approval interactions.
- [x] UTMB Health demonstrates the account-alias relationship to University of Texas Medical Branch.
- [x] Organization classification follows BloomOS alias match, deterministic rule, then manual review.

## Verification

- [x] `npm run typecheck`
- [x] `npm run build`
- [x] Desktop Market Explorer visually inspected at 1440px.
- [x] Mobile Market Explorer visually inspected at 390px.
- [x] Organization matching queue visually inspected at 1440px.

---

# Design QA: 2026 Executive Market Briefing

## Comparison Target

- Source visual truth:
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-audit/01-lazio-top.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-audit/03-lazio-scroll-2.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-audit/15-bloomforce-briefing-top.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-audit/16-bloomforce-briefing-scroll.png`
- Implementation URL: `http://127.0.0.1:4173/preview/editorial`
- Implementation screenshots:
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/14-editorial-final-1280.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/16-editorial-final-cost-step.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/17-editorial-final-mobile.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/18-editorial-final-mobile-workforce.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/20-editorial-revised-hero-tight.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/21-editorial-revised-cost.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/23-editorial-revised-demand-hot.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/24-editorial-revised-demand-gate.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/27-editorial-final-mobile-hero.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/28-editorial-final-mobile-demand.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/29-editorial-functional-demand.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/30-editorial-module-gate.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/31-editorial-people-grid.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/32-editorial-training-people.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/33-editorial-mobile-module.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/35-editorial-mobile-training.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/36-editorial-leadership-salaries.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/37-editorial-leadership-salaries-mobile.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/38-editorial-leadership-salaries-mobile-lower.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/39-editorial-leadership-levels.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/40-editorial-leadership-levels-lower.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/42-editorial-leadership-levels-mobile-anchor.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/43-editorial-exa-leadership-desktop.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/45-editorial-exa-leadership-lower.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/50-editorial-exa-final-mobile.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/51-editorial-exa-final-mobile-lower.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/58-editorial-grouped-leadership-centered.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/60-editorial-grouped-leadership-mobile-chart.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/61-editorial-grouped-leadership-mobile-top.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/62-editorial-balanced-percentages-mobile.png`
  - `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/63-editorial-balanced-layoff-total.png`
- Viewports: 1280x720 desktop, 1440x900 desktop, and 390x844 mobile.
- State: public preview, live Supabase-backed benchmark data, national market, all levels, Application Analyst and BI / Reporting Developer selections tested.

## Comparison Evidence

- Full-view comparison: `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/comparison-top.png`
- Focused story comparison: `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/comparison-story.png`
- Workforce refinement comparison: `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/comparison-workforce-upgrade.png`
- Leadership salary comparison: `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/comparison-leadership-salaries.png`
- Expanded leadership-level comparison: `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/comparison-leadership-levels-expanded.png`
- Employer-evidence leadership comparison: `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/comparison-leadership-exa-evidence.png`
- Grouped leadership-level comparison: `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/comparison-leadership-grouped-levels.png`
- Balanced-percentage comparison: `/Users/zacha/.codex/visualizations/2026/05/11/019e175b-46a1-78a2-ac63-462fcd4acb44/report-editorial-qa/comparison-balanced-percentages.png`
- The full view confirms the intended adaptation: a persistent report frame, decisive headline scale, and immediate utility, expressed with Bloomforce's lighter palette and data density.
- The focused view confirms the chapter pattern: narrative copy remains readable while the right-side visualization changes with the active step. The focused comparison was necessary because chart labels and sticky proportions were too small to judge in the full-width composite.

## Fidelity Review

- Fonts and typography: Newsreader creates the intended editorial display voice; Libre Franklin keeps controls and body copy legible; Spline Sans Mono is limited to labels and evidence. Hierarchy and wrapping remain clear at all tested viewports.
- Spacing and layout rhythm: desktop keeps a controlled two-column frame and a visible next-section cue; mobile removes sticky stages and uses concise sequential panels. No horizontal overflow or overlapping header/content was found.
- Colors and tokens: Bloomforce navy and teal lead the system, with amber and rose reserved for data states. Contrast is strong on paper and ink chapters without turning the report into a one-color dashboard.
- Image quality and asset fidelity: the experience is intentionally data-led and uses the existing Bloomforce vector logo. No decorative image assets from the reference were required or replaced with placeholder imagery.
- Copy and content: chapter language is executive, direct, and decision-oriented. Survey promotion is quiet and contextual instead of marquee-like.
- Controls and interactions: role, level, market, compensation input, contribution gate, report-access modal, chapter links, survey links, and leadership CTA retain their intended paths and semantics.
- Accessibility: semantic headings, labels, figure summaries, focusable native controls, reduced-motion behavior, and mobile tap targets are present. Animated desktop figures have visible narrative and figure text equivalents.

## Findings

- No actionable P0, P1, or P2 findings remain.
- [P3] The static-generation build logs existing Recharts zero-dimension warnings while prerendering other report routes. The new editorial route renders without browser console warnings, but the shared chart warnings can be cleaned up separately.

## Comparison History

1. First pass, P2: the opening benchmark extended too far below the fold at 1280x720, weakening the report's chapter cue. Fixed with a compact low-height desktop layout; post-fix evidence is `14-editorial-final-1280.png`.
2. First pass, P2: Framer Motion's scroll measurement emitted a development warning and relied on a positioned scroll container. Replaced active-step measurement with a native IntersectionObserver while retaining Framer Motion for chart transitions. Production browser logs are empty after the fix.
3. First pass, P2: the workforce dot scene was unsuitable for mobile pinning. Replaced mobile sticky stages with sequential static data panels; post-fix evidence is `18-editorial-final-mobile-workforce.png`.
4. Revision pass, P2: removing the interactive benchmark left excess empty space in the desktop hero. Tightened the editorial hero height and retained a visible next-chapter cue; post-fix evidence is `20-editorial-revised-hero-tight.png`.
5. Revision pass, P2: the report could inherit a previously selected role from local storage even after the selector was removed. Added a non-persistent Application Analyst profile for this route so every compensation and action figure stays aligned to the stated reference role.
6. Revision pass, P2: the detailed demand ranking was visible before contribution. Reframed the section around the 13% IT Manager signal and gated the role-by-role ranking; post-fix evidence is `23-editorial-revised-demand-hot.png` and `24-editorial-revised-demand-gate.png`.
7. Revision pass, P2: the demand teaser opened its form below the viewport. Added a sticky-header-aware scroll target so the heading and form are brought into view together.
8. Demand-depth pass, P2: the demand story stopped at broad role families and did not answer which Epic applications are moving. Added a visible 30-day functional view plus a gated Application Analyst module ranking, using Willow as the current teaser and preserving module-level publication in future refreshes.
9. Workforce refinement pass, P2: loose circles visually overlapped across categories and read as an imprecise decorative swarm. Replaced them with consistently sized person markers arranged in distinct cohort lanes and strengthened the contrast between workforce responses; post-fix evidence is `comparison-workforce-upgrade.png`.
10. Workforce content pass, P2: training professionals were absent from the narrative around AI and vendor-led instruction. Added a training-specific step that separates current posting movement from broader AI sentiment and explains the continuing need for local workflow, adoption, and at-the-elbow support.
11. Leadership compensation pass, P2: the leadership brief ended with hiring guidance but no compensation ladder. Added five scope-based salary bands from Manager through Vice President, with title aliases, middle-50% ranges, medians, sample sizes, source labels, and confidence context. The shared scale makes progression visible without implying that health-system titles are standardized.
12. Leadership-level expansion, P2: Associate Director, Senior Director, and Associate Vice President were initially grouped into adjacent title bands. Split all three into dedicated rows. Associate Director and Senior Director use direct salary-survey observations with early-signal labels; Associate VP uses a current Stony Brook Medicine Enterprise Applications posting with a visible source link and directional-data warning.
13. Employer-evidence refinement, P2: the three added leadership levels relied on very small survey samples or a single posting. Re-ran the Exa search against exact healthcare IT titles and salary-bearing postings. Associate Director now shows a current MSK Epic range, Senior Director shows the observed span and median midpoint across University of Rochester and Sutter Health postings, and Associate VP combines Stony Brook Medicine and Advocate Health. Posting spans, midpoint methodology, annualization, links, sample sizes, and confidence remain explicit.
14. Leadership-progression refinement, P2: the single Associate Director posting produced a midpoint above the mature Director and Executive Director benchmarks, making unlike evidence look directly comparable. Removed Associate Director and consolidated the ladder into three shared-scale tracks: Manager to Senior Manager, Director to Senior / Executive Director, and Associate / Assistant VP to Vice President. The Senior / Executive Director reference visibly combines 27 public records with three survey observations rather than presenting a synthetic median as a mature benchmark.
15. Percentage-total correction, P2: categorical shares were rounded independently, allowing complete distributions such as the Layoff / RIF split to display as 101%. Added normalized largest-remainder rounding for whole-number display percentages. Work location, RTO response, AI impact, Layoff / RIF, and work-model workforce-share distributions now each total exactly 100% while their visual widths continue to use normalized underlying values.

## Tests

- `npm run typecheck`: passed.
- `npm run build`: passed.
- Browser console: no errors or warnings on the production preview route.
- Responsive layout: 1280x720, 1440x900, and 390x844 checked; mobile `scrollWidth` equals 390px.
- Primary interactions: role selection updated the benchmark and downstream chapter data; contribution gate expanded; report-access modal opened; chapter and survey destinations were verified.
- Revised editorial interactions: the opening role selector is absent; Application Analyst remains fixed across the compensation chapter; the demand teaser reveals the contribution form and moves it below the sticky header.
- Revised mobile layout: the manager narrative, 13% demand signal, and lead-capture panel fit at 390x844 with no horizontal overflow.
- Demand refinement: functional movement, gated module movement, and the module-access form were verified against the production preview. The CTA expands the contribution form and scrolls it into view.
- Workforce refinement: aligned person cohorts were checked at 1280x720; sequential training panels were checked at 390x844. Mobile `scrollWidth` remains 390px.
- Leadership salary ladder: checked at 1280x720 and 390x844. Long Executive Director and Associate Vice President labels wrap or truncate safely, all ranges remain on-scale, and mobile `scrollWidth` remains 390px.
- Grouped leadership levels: three progression tracks checked at 1280x720 and 390x844. Paired levels share one salary scale, labels remain legible, the Stony Brook and Advocate source links remain keyboard-accessible, and mobile `scrollWidth` remains 390px.
- Employer-evidence refinement: Exa returned successful `200` responses after the account credit update. Exact-title salary results were reviewed before use; source links, posting-span labels, midpoint labels, and the 2,080-hour AVP annualization note were verified. Updated desktop and mobile salary rows remain on-scale, and mobile `scrollWidth` remains 390px.
- Percentage totals: mobile editorial distributions verified as Work location `69 + 25 + 6 = 100`, RTO `62 + 28 + 10 = 100`, AI impact `45 + 43 + 12 = 100`, Layoff / RIF `70 + 30 = 100`, and work-model workforce share `50 + 22 + 28 = 100`. Mobile `scrollWidth` remains 390px.
- Performance check: route entry JavaScript is approximately 89 KB gzip across shared and route chunks.

## Implementation Checklist

- [x] Keep `/preview` unchanged.
- [x] Add unlisted, noindex `/preview/editorial` route.
- [x] Preserve live data, filters, contribution gate, freshness, and CTA destinations.
- [x] Deliver four connected chapters with persistent desktop visualizations.
- [x] Replace mobile pinning with static sequential story panels.
- [x] Respect reduced motion and include chart text alternatives.
- [x] Verify production build and browser-rendered layouts.

final result: passed
