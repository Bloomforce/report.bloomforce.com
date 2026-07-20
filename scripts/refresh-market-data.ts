import { createClient } from '@supabase/supabase-js';
import { promotePendingSurveyResponses } from '../src/lib/insights/survey-promotion';
import { refreshPublishedMarketData } from '../src/lib/insights/market-refresh';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Supabase admin env vars are not configured');

async function main() {
  const db = createClient(url!, key!, { auth: { persistSession: false } });
  const promotion = await promotePendingSurveyResponses(db);
  const refresh = await refreshPublishedMarketData(db);
  console.log(JSON.stringify({ promotion, refresh }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
