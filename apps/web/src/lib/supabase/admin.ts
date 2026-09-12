import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@nnoo/supabase'

/**
 * Privileged Supabase admin client using the service-role key.
 *
 * ⚠️  SERVER-ONLY — never import this file from browser or mobile code.
 *
 * Use this client only for operations that require bypassing RLS,
 * such as admin user management or system-level data access.
 * Normal user operations should use the standard server client
 * that respects RLS through the user's session.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for admin client. '
      + 'These must be set in server-only environment variables.'
    )
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
