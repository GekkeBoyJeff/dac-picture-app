"use client"

import { useState, useCallback } from "react"

const PASSWORD = process.env.NEXT_PUBLIC_REMOTE_PASSWORD || ""
const SESSION_KEY = "dac_remote_auth"

export function isRemoteAuthenticated() {
  if (typeof window === "undefined") return false
  return sessionStorage.getItem(SESSION_KEY) === "1"
}

export function RemotePasswordGate({ onAuthenticated }) {
  const [value, setValue] = useState("")
  const [error, setError] = useState(false)

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      if (!PASSWORD) {
        sessionStorage.setItem(SESSION_KEY, "1")
        onAuthenticated()
        return
      }
      if (value === PASSWORD) {
        sessionStorage.setItem(SESSION_KEY, "1")
        onAuthenticated()
      } else {
        setError(true)
        setValue("")
        setTimeout(() => setError(false), 800)
      }
    },
    [value, onAuthenticated],
  )

  return (
    <div className="flex min-h-dvh items-center justify-center bg-base px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-gold">DAC Remote</h1>
          <p className="text-sm text-ink-muted">Voer het wachtwoord in om verder te gaan</p>
          {!PASSWORD && (
            <p className="mt-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
              NEXT_PUBLIC_REMOTE_PASSWORD niet ingesteld — toegang voor iedereen
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Wachtwoord"
            autoFocus
            autoComplete="current-password"
            className={`w-full rounded-2xl border bg-surface px-4 py-3 text-ink placeholder:text-ink-subtle outline-none transition-colors focus:border-gold/60 ${
              error ? "border-red-400/60 bg-red-500/10" : "border-hairline"
            }`}
          />
          <button
            type="submit"
            className="w-full cursor-pointer rounded-2xl bg-gold py-3 text-sm font-semibold text-[#1b1407] transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            Inloggen
          </button>
        </form>
      </div>
    </div>
  )
}
