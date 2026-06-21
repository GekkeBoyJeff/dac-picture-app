import { createClient } from "@supabase/supabase-js"

// NEXT_PUBLIC_* are inlined at build time; reading inside the function keeps it
// testable (Vitest can mutate process.env) and avoids a stale module-load capture.
export const isRemoteConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)

// The /admin password (operator-only). Public/inlined by design — it gates
// casual access and is echoed in commands so the booth ignores unauthenticated
// traffic on the shared channel. Empty string when unset.
export const getRemotePassword = () => process.env.NEXT_PUBLIC_REMOTE_PASSWORD || ""

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
