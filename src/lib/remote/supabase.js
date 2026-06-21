import { createClient } from "@supabase/supabase-js"

// NEXT_PUBLIC_* are inlined at build time; reading inside the function keeps it
// testable (Vitest can mutate process.env) and avoids a stale module-load capture.
export const isRemoteConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)

let client = null
export function getSupabaseClient() {
  if (!isRemoteConfigured()) return null
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: false }, realtime: { params: { eventsPerSecond: 20 } } },
    )
  }
  return client
}