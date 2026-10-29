import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getPublicEnv } from '@/lib/env';
import { getServerEnv } from '@/lib/env.server';

/**
 * Service-role client. BYPASSES RLS. Server-only (the `server-only` import fails the
 * build if this file is ever pulled into a client bundle).
 *
 * Allowed uses: writing audit entries, private evidence storage, creating notifications.
 * Never use it to read data on behalf of a user without authorizing them first.
 */
export function createAdminClient() {
  return createSupabaseClient(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL, getServerEnv().SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
