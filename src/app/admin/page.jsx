"use client"

import { useEffect, useState } from "react"
import { AdminPanel } from "@/components/remote/AdminPanel"
import { useRemoteController } from "@/hooks/useRemoteController"
import { isRemoteConfigured, getRemotePassword } from "@/lib/remote/supabase"

const AUTH_KEY = "dac_admin_auth"

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState("")
  const [error, setError] = useState(false)

  // Client-only: read the session flag after mount (avoids SSR/hydration issues
  // on the static export). Auto-authes when no password is configured.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!getRemotePassword() || sessionStorage.getItem(AUTH_KEY) === "1") setAuthed(true)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Only connect once authenticated.
  const { status, send, remoteState, retry } = useRemoteController({ enabled: authed })

  if (!isRemoteConfigured()) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-base px-4 text-center">
        <p className="max-w-sm text-sm text-ink-muted">
          Admin is niet geconfigureerd op deze build (Supabase-omgevingsvariabelen ontbreken).
        </p>
      </div>
    )
  }

  if (!authed) {
    const required = getRemotePassword()
    const submit = () => {
      if (!required || pw === required) {
        sessionStorage.setItem(AUTH_KEY, "1")
        setAuthed(true)
      } else {
        setError(true)
      }
    }
    return (
      <div className="flex min-h-dvh items-center justify-center bg-base px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <h1 className="text-2xl font-bold text-gold">DAC Admin</h1>
          <p className="text-sm text-ink-muted">Voer het wachtwoord in om de booth te bedienen</p>
          <div className="space-y-3">
            <input
              type="password"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value)
                setError(false)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit()
              }}
              placeholder="Wachtwoord"
              autoFocus
              className="w-full rounded-2xl border border-hairline bg-surface px-4 py-3 text-center text-lg text-ink placeholder:text-ink-subtle outline-none focus:border-gold/60"
            />
            {error && <p className="text-sm text-danger">Onjuist wachtwoord</p>}
            <button
              onClick={submit}
              className="w-full cursor-pointer rounded-2xl bg-gold py-3 text-sm font-semibold text-[#1b1407] transition-opacity hover:opacity-90"
            >
              Inloggen
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <AdminPanel remoteState={remoteState} send={send} status={status} retry={retry} />
}
