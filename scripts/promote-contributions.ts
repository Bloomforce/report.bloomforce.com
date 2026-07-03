/**
 * Contribution quarantine → promote. Run with SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY set (nightly via cron/n8n, or manually):
 *   npx tsx scripts/promote-contributions.ts
 *
 * Rules (same bar every data point passes):
 *  - drop duplicates: same email-linked response + role + base within 30 days
 *  - band check per role group (IC 40–300k, mgmt 60–700k)
 *  - per-family 1.5×IQR outlier check against accepted actuals
 * Accepted rows become comp_observations (actual, web_contribution).
 * NOTE: after promoting, re-run the publish steps (npm run seed recomputes
 * everything from the DB + exports) so the public number picks them up.
 */
import { createClient } from '@supabase/supabase-js';
import { iqrTrim } from './lib/normalize';

const MGMT = new Set(['MGR', 'DIR', 'VP', 'EXEC']);

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  const db = createClient(url, key, { auth: { persistSession: false } });

  const { data: pending, error } = await db
    .from('survey_responses')
    .select('*')
    .eq('source', 'web_contribution')
    .eq('status', 'pending');
  if (error) throw error;
  if (!pending?.length) {
    console.log('No pending contributions.');
    return;
  }

  const { data: accepted } = await db
    .from('comp_observations')
    .select('role_family, value')
    .eq('observation_type', 'actual')
    .eq('in_benchmark', true);

  const byFamily = new Map<string, number[]>();
  for (const o of accepted ?? []) {
    if (!byFamily.has(o.role_family)) byFamily.set(o.role_family, []);
    byFamily.get(o.role_family)!.push(Number(o.value));
  }

  let promoted = 0;
  let rejected = 0;
  for (const row of pending) {
    const base = Number(row.base_comp);
    const [lo, hi] = MGMT.has(row.role_family) ? [60000, 700000] : [40000, 300000];
    let ok = Number.isFinite(base) && base >= lo && base <= hi;

    if (ok) {
      const famValues = byFamily.get(row.role_family) ?? [];
      if (famValues.length >= 8) {
        const surviving = new Set(iqrTrim([...famValues, base]));
        ok = surviving.has(base);
      }
    }

    // Duplicate: same role + same base within 30 days among contributions
    if (ok) {
      const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
      const dupe = pending.find(
        (p) => p.id !== row.id && p.role_key === row.role_key && Number(p.base_comp) === base && p.submitted_at > cutoff && p.status === 'accepted',
      );
      if (dupe) ok = false;
    }

    if (!ok) {
      await db.from('survey_responses').update({ status: 'rejected' }).eq('id', row.id);
      rejected++;
      continue;
    }

    await db.from('survey_responses').update({ status: 'accepted' }).eq('id', row.id);
    await db.from('comp_observations').insert({
      source: 'web_contribution',
      observation_type: 'actual',
      role_family: row.role_family,
      role_key: row.role_key,
      seniority_level: row.seniority_level,
      region: row.region,
      work_model: row.work_model,
      employer_type: row.employer_type,
      credential: row.credential,
      period: `${new Date().toISOString().slice(0, 7)}-01`,
      value: Number(row.total_comp ?? row.base_comp),
      currency: 'USD',
      in_benchmark: true,
      survey_year: row.survey_year,
      survey_response_id: row.id,
    });
    row.status = 'accepted';
    promoted++;
  }

  console.log(`Promoted ${promoted}, rejected ${rejected}. Re-run the publish step to refresh the public views.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
