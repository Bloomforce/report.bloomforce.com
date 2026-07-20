import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/** Service-role client — API routes only. Never import from client components. */
export function supabaseAdmin(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase admin env vars are not configured');
    if (key.startsWith('sb_publishable_')) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY contains a publishable key. Use a Supabase secret key or legacy service_role key for server-only market operations.',
      );
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}
