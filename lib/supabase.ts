import { createClient } from '@supabase/supabase-js'

/**
 * Returns a Supabase client, or null when the env vars aren't present
 * (e.g. during a local build without .env.local).  Callers must guard:
 *   const db = getSupabase(); if (db) { await db.from(...) }
 */
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}
