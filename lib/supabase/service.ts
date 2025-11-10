import { createClient } from '@supabase/supabase-js'

/**
 * Create a Supabase client with service role privileges
 * This bypasses RLS policies - use carefully and only in server contexts
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
