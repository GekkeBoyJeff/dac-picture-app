"use client"

import { useEffect, useRef, useMemo } from "react"
import { BASE_PATH } from "@/lib/config/basePath"

export function RemoteConnectModal({
  isOpen,
  onClose,
  onStop,
  roomCode,
  token,
  status,
  pendingApproval,
  approve,
  deny,
}) {
  const canvasRef = useRef(null)

  const remoteUrl = useMemo(() => {
    if (typeof window === "undefined") return ""
    const k = token ? `&k=${token}` : ""
    return `${window.location.origin}${BASE_PATH}/remote?r=${roomCode}${k}`
  }, [roomCode, token])

  useEffect(() => {
    if (!isOpen || !canvasRef.current || !remoteUrl) return
    let cancelled = false
    import("qrcode").then((mod) => {
      if (cancelled || !canvasRef.current) return
      const QRCode = mod.default ?? mod
      QRCode.toCanvas(canvasRef.current, remoteUrl, {
        width: 200,
        margin: 2,
        color: { dark: "#f5d16a", light: "#18130a" },
      })
    })
    return () => {
      cancelled = true
    }
  }, [isOpen, remoteUrl])

  if (!isOpen) return null

  const isConnected = status === "connected"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-hairline bg-base p-8 shadow-2xl w-full max-w-sm">
        <h2 className="text-xl font-semibold text-ink">Remote Panel</h2>

        <div className="rounded-2xl overflow-hidden border-2 border-gold/30 p-2 bg-[#18130a]">
          <canvas ref={canvasRef} className="block rounded-xl" />
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-ink-dim">Room code</p>
          <p className="font-mono text-4xl font-bold tracking-[0.3em] text-gold">{roomCode}</p>
          <p className="mt-1 text-xs text-ink-muted break-all max-w-xs">{remoteUrl}</p>
        </div>

        <div className="flex items-center gap-2.5 rounded-full border border-hairline bg-surface px-4 py-2">
          <span
            className={`h-2 w-2 rounded-full animate-pulse ${status === "connected" ? "bg-green-400" : "bg-ink-subtle"}`}
          />
          <span
            className={`text-sm font-medium ${status === "connected" ? "text-green-400" : "text-ink-muted"}`}
          >
            {status === "connected"
              ? "Verbonden"
              : status === "error"
                ? "Supabase niet bereikbaar"
                : status === "awaiting-approval"
                  ? "Telefoon wil verbinden…"
                  : "Wachten op verbinding…"}
          </span>
        </div>

        {pendingApproval && (
          <div className="w-full space-y-3 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-center">
            <p className="text-sm text-ink">Een telefoon wil de booth bedienen. Toestaan?</p>
            <div className="flex gap-3">
              <button
                onClick={deny}
                className="flex-1 cursor-pointer rounded-xl border border-hairline px-4 py-2 text-sm text-ink-muted hover:bg-surface"
              >
                Weigeren
              </button>
              <button
                onClick={approve}
                className="flex-1 cursor-pointer rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-[#1b1407] hover:opacity-90"
              >
                Toestaan
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-ink-dim">
          De verbinding blijft actief op de achtergrond als je dit venster sluit.
        </p>

        <div className="flex w-full items-center gap-3">
          <button
            onClick={onStop}
            className="flex-1 cursor-pointer rounded-2xl border border-danger/40 px-4 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
          >
            Stop remote
          </button>
          <button
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-2xl bg-gold px-4 py-2.5 text-sm font-semibold text-[#1b1407] transition-opacity hover:opacity-90"
          >
            {isConnected ? "Verbergen" : "Sluiten"}
          </button>
        </div>
      </div>
    </div>
  )
}