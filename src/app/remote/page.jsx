"use client"

import { useState, useCallback, useEffect } from "react"
import { RemotePasswordGate, isRemoteAuthenticated } from "@/components/remote/RemotePasswordGate"
import { RemotePanel } from "@/components/remote/RemotePanel"
import { usePeerRemote } from "@/hooks/usePeerRemote"

export default function RemotePage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [code, setCode] = useState(null)
  const [authToken, setAuthToken] = useState(null)
  const [manualCode, setManualCode] = useState("")
  const [remoteState, setRemoteState] = useState({})

  // Client-only mount reads (sessionStorage + URL params). State is set after
  // mount on purpose, to avoid an SSR/hydration mismatch on the static export.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isRemoteAuthenticated()) setAuthenticated(true)

    const params = new URLSearchParams(window.location.search)
    const r = (params.get("r") || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 4)
    if (r.length === 4) setCode(r)
    const k = params.get("k")
    if (k) setAuthToken(k)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleState = useCallback((payload) => {
    setRemoteState((prev) => ({ ...prev, ...payload }))
  }, [])

  const { status, send, remoteStream } = usePeerRemote({
    code: authenticated ? code : null,
    authToken,
    onState: handleState,
  })

  if (!authenticated) {
    return <RemotePasswordGate onAuthenticated={() => setAuthenticated(true)} />
  }

  if (!code) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-base px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <h1 className="text-2xl font-bold text-gold">DAC Remote</h1>
          <p className="text-sm text-ink-muted">
            Voer de 4-cijferige code in die op het scherm staat
          </p>
          <div className="space-y-3">
            <input
              type="text"
              value={manualCode}
              onChange={(e) =>
                setManualCode(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 4),
                )
              }
              placeholder="bijv. DAC7"
              maxLength={4}
              autoFocus
              className="w-full rounded-2xl border border-hairline bg-surface px-4 py-3 text-center font-mono text-2xl tracking-widest text-ink placeholder:text-ink-subtle outline-none focus:border-gold/60"
            />
            <button
              onClick={() => {
                if (manualCode.length === 4) setCode(manualCode)
              }}
              disabled={manualCode.length !== 4}
              className="w-full cursor-pointer rounded-2xl bg-gold py-3 text-sm font-semibold text-[#1b1407] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Verbinden
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <RemotePanel remoteState={remoteState} send={send} stream={remoteStream} status={status} />
}