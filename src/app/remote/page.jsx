"use client"

import { useEffect, useState } from "react"
import { RemotePanel } from "@/components/remote/RemotePanel"
import { useRemoteController } from "@/hooks/useRemoteController"
import { normalizeCode, CODE_LEN } from "@/lib/remote/protocol"
import { isRemoteConfigured } from "@/lib/remote/supabase"

export default function RemotePage() {
  const [code, setCode] = useState(null)
  const [token, setToken] = useState(null)
  const [manualCode, setManualCode] = useState("")

  // Client-only mount reads (URL params). Set after mount to avoid SSR/hydration
  // mismatch on the static export — window/URLSearchParams are never touched in prerender.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const r = normalizeCode(params.get("r"))
    if (r.length === CODE_LEN) setCode(r)
    const k = params.get("k")
    if (k) setToken(k)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  const { status, send, remoteState, retry } = useRemoteController({ code, token })

  if (!isRemoteConfigured()) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-base px-4 text-center">
        <p className="max-w-sm text-sm text-ink-muted">
          Remote is niet geconfigureerd op deze build (Supabase-omgevingsvariabelen ontbreken).
        </p>
      </div>
    )
  }

  if (!code) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-base px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <h1 className="text-2xl font-bold text-gold">DAC Remote</h1>
          <p className="text-sm text-ink-muted">
            Voer de 6-cijferige code in die op het scherm staat
          </p>
          <div className="space-y-3">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(normalizeCode(e.target.value))}
              placeholder="bijv. DAC7XK"
              maxLength={CODE_LEN}
              autoFocus
              className="w-full rounded-2xl border border-hairline bg-surface px-4 py-3 text-center font-mono text-2xl tracking-widest text-ink placeholder:text-ink-subtle outline-none focus:border-gold/60"
            />
            <button
              onClick={() => {
                if (manualCode.length === CODE_LEN) setCode(manualCode)
              }}
              disabled={manualCode.length !== CODE_LEN}
              className="w-full cursor-pointer rounded-2xl bg-gold py-3 text-sm font-semibold text-[#1b1407] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Verbinden
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <RemotePanel remoteState={remoteState} send={send} status={status} retry={retry} />
}