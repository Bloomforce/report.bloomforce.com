/**
 * Insight mining: run the same in-memory pipeline as the seed and interrogate
 * it against the four narrative hypotheses. Read-only; prints a report.
 *   npx tsx scripts/seed/analyze.ts
 */
import path from 'node:path';
import { loadSurveys } from './load-survey';
import { loadUm } from './load-um';
import { loadJobs } from './load-jobs';
import { buildObservations, publishBenchmark, publishSentiment } from './publish';
import { median } from '../lib/normalize';

const ROOT = path.resolve(__dirname, '../..');
const DATA = path.join(ROOT, 'Bloomforce Insights 2.0');

function pctOf(rows: { pct: number; option_key: string }[], key: string): number | null {
  const r = rows.find((x) => x.option_key === key);
  return r ? Math.round(r.pct * 100) : null;
}

async function main() {
  const asOf = new Date();
  const surveys = loadSurveys({
    y2024: path.join(DATA, 'survey-exports/EHR-Salary-Insights-Survey(2026-06-17).csv'),
    y2025: path.join(DATA, 'survey-exports/2025-EHR-Salary-Insights-Survey(2026-06-17).csv'),
  });
  const um = loadUm(path.join(DATA, 'public-salary-exports/um_michigan_medicine_observations_full.csv'));
  const jobs = loadJobs(path.join(DATA, 'apify-exports'));
  const obs = buildObservations(surveys, um, jobs, asOf);
  const cells = publishBenchmark(obs, jobs, asOf);
  const sentiment = publishSentiment(surveys);

  const s = (metric: string, year: number, family = 'all') =>
    sentiment.filter((r) => r.metric_key === metric && r.survey_year === year && r.role_family === family && r.work_model === 'all');

  console.log('══ HYPOTHESIS 1 · Career pathing ══');
  const ladder = ['AA.L1', 'AA.L2', 'AA.L3', 'AA.L4', 'MGR.M1', 'DIR.M2', 'VP.M3', 'EXEC.exec'];
  for (const rk of ladder) {
    const c = cells.find((x) => x.role_key === rk && x.region === 'National' && x.work_model === 'all' && x.employer_type === 'all' && x.credential === 'all');
    if (c) console.log(`  ${rk.padEnd(10)} median $${c.blended_median.toLocaleString()}  (n=${c.n_observations}, ${c.confidence_tier})`);
  }
  const mob25 = s('mobility_role', 2025);
  const mob24 = s('mobility_role', 2024);
  console.log(`  Promotion path 2025: clear=${pctOf(mob25, 'clear')}% blocked=${pctOf(mob25, 'blocked')}% unclear=${pctOf(mob25, 'unclear')}%`);
  console.log(`  Promotion path 2024: clear=${pctOf(mob24, 'clear')}% blocked=${pctOf(mob24, 'blocked')}% unclear=${pctOf(mob24, 'unclear')}%`);

  console.log('\n══ HYPOTHESIS 2 · Remote vs RTO ══');
  for (const year of [2024, 2025]) {
    const wm = s('remote_share', year);
    const rto = s('rto_response', year);
    console.log(`  ${year}: remote=${pctOf(wm, 'remote')}% hybrid=${pctOf(wm, 'hybrid')}% onsite=${pctOf(wm, 'onsite')}% | RTO: look=${pctOf(rto, 'look')}% negotiate=${pctOf(rto, 'negotiate')}% comply=${pctOf(rto, 'comply')}%`);
  }
  const epic = jobs.filter((j) => j.classification.isEpicIt && j.classification.family && !j.is_contractish && j.posted_date);
  const withWm = epic.filter((j) => j.workplace_type);
  const monthlyRemote: string[] = [];
  for (let m = 11; m >= 0; m -= 3) {
    const end = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() - m + 3, 1)).toISOString().slice(0, 10);
    const start = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() - m, 1)).toISOString().slice(0, 10);
    const q = withWm.filter((j) => j.posted_date! >= start && j.posted_date! < end);
    if (q.length >= 30) monthlyRemote.push(`${start.slice(0, 7)}: ${Math.round((q.filter((j) => j.workplace_type === 'remote').length / q.length) * 100)}% (n=${q.length})`);
  }
  console.log(`  Remote share of POSTINGS by quarter: ${monthlyRemote.join(' → ')}`);
  const mgr = s('mgr_remote_view', 2025);
  console.log(`  Managers: more=${pctOf(mgr, 'more')}% equal=${pctOf(mgr, 'equal')}% less=${pctOf(mgr, 'less')}%`);
  const wmCells = cells.filter((c) => c.role_family === 'AA' && c.work_model !== 'all');
  for (const c of wmCells) console.log(`  AA ${c.work_model}: median $${c.blended_median.toLocaleString()} (n=${c.n_observations})`);

  console.log('\n══ HYPOTHESIS 3 · AI reshaping Epic work ══');
  const ai = s('ai_impact', 2025);
  const aiOrg = s('ai_org', 2025);
  console.log(`  Impact: no_impact=${pctOf(ai, 'no_impact')}% enhance=${pctOf(ai, 'enhance')}% transform=${pctOf(ai, 'transform')}%`);
  console.log(`  Org staffing: have=${pctOf(aiOrg, 'have')}% plan=${pctOf(aiOrg, 'plan')}% no_plan=${pctOf(aiOrg, 'no_plan')}% unsure=${pctOf(aiOrg, 'unsure')}%`);
  const aiJobs = jobs.filter((j) => /\bai\b|artificial intelligence|machine learning|\bml\b|ambient/i.test(j.job_title));
  console.log(`  Postings with AI/ML in title: ${aiJobs.length} of ${jobs.length}`);
  const aiComp = aiJobs.map((j) => j.yearly_min_comp && j.yearly_max_comp ? (j.yearly_min_comp + j.yearly_max_comp) / 2 : null).filter(Boolean) as number[];
  if (aiComp.length >= 5) console.log(`  AI-title posted median: $${Math.round(median(aiComp)!).toLocaleString()} (n=${aiComp.length})`);

  console.log('\n══ HYPOTHESIS 4 · Consolidation & layoffs ══');
  for (const year of [2024, 2025]) {
    const ma = s('ma_activity', year);
    const rif = s('layoffs', year);
    console.log(`  ${year}: M&A=${pctOf(ma, 'yes')}%  RIF=${pctOf(rif, 'yes')}%`);
  }
  const maStr = s('ma_stronger', 2025);
  console.log(`  Post-M&A position: stronger=${pctOf(maStr, 'yes')}% not=${pctOf(maStr, 'no')}% unsure=${pctOf(maStr, 'unsure')}%`);
  const seek25 = s('job_seeking', 2025);
  const seek24 = s('job_seeking', 2024);
  console.log(`  Job seeking 2025: none=${pctOf(seek25, 'none')}% passive=${pctOf(seek25, 'passive')}% planning=${pctOf(seek25, 'planning')}% active=${pctOf(seek25, 'active')}%`);
  console.log(`  Job seeking 2024: none=${pctOf(seek24, 'none')}% passive=${pctOf(seek24, 'passive')}% planning=${pctOf(seek24, 'planning')}% active=${pctOf(seek24, 'active')}%`);
  const fair = s('fair_comp', 2025);
  console.log(`  Fairly paid: yes=${pctOf(fair, 'yes')}% no=${pctOf(fair, 'no')}%`);

  console.log('\n══ EXTRAS · movers & posted trend ══');
  const movers = cells
    .filter((c) => c.region === 'National' && c.seniority_level === 'all' && c.work_model === 'all' && c.employer_type === 'all' && c.credential === 'all' && c.median_delta_90d !== null)
    .sort((a, b) => Math.abs(b.median_delta_90d!) - Math.abs(a.median_delta_90d!));
  for (const c of movers.slice(0, 5)) console.log(`  ${c.role_family}: 90d posted delta ${c.median_delta_90d! >= 0 ? '+' : ''}$${c.median_delta_90d!.toLocaleString()} (demand ${c.demand_count})`);
  const wlb25 = s('satisfaction_wlb', 2025);
  const wlb24 = s('satisfaction_wlb', 2024);
  console.log(`  WLB satisfied: 2025=${pctOf(wlb25, 'satisfied')}% vs 2024=${pctOf(wlb24, 'satisfied')}% (different scales: y/n vs likert)`);
  const rec = s('recognized', 2025);
  console.log(`  Recognized by manager: ${pctOf(rec, 'yes')}%`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
