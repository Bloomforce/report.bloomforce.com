/**
 * Promote quarantined website/Jotform survey responses into canonical
 * base-salary observations. Safe to run repeatedly.
 */
import { createClient } from '@supabase/supabase-js';
import { promotePendingSurveyResponses } from '../src/lib/insights/survey-promotion';

async function main() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');

  const db = createClient(url, key, { auth: { persistSession: false } });
  const summary = await promotePendingSurveyResponses(db);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
