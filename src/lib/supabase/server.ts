import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder-project.supabase.co';
const SUPABASE_SERVICE_ROLE_OR_ANON_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'placeholder-service-key';

let serverClient: SupabaseClient | null = null;

/**
 * Returns a server-side Supabase client instance.
 * Prefers SUPABASE_SERVICE_ROLE_KEY if present for admin operations, or falls back to anon key / placeholders.
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (!serverClient) {
    serverClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_OR_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return serverClient;
}
