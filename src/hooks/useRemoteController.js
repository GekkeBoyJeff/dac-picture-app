"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getSupabaseClient, isRemoteConfigured } from "@/lib/remote/supabase"
import {
  PROTOCOL_VERSION,
  channelName,
  generateClientId,
  mergeRemoteState,
} from "@/lib/remote/protocol"

const CONNECT_TIMEOUT_MS = 10000

export function useRemoteController({ code, token }) {
  const [status, setStatus] = useState("idle")
  const [remoteState, setRemoteState] = useState({})
  const [attempt, setAttempt] = useState(0)

  const fromRef = useRef(generateClientId())
  const channelRef = useRef(null)
  const localEditsRef = useRef({})
  const timeoutRef = useRef(null)

  const send = useCallback((cmd) => {
    if (cmd?.t === "set" || cmd?.t === "toggle") localEditsRef.current[cmd.key] = Date.now()
    channelRef.current?.send({
      type: "broadcast",
      event: "cmd",
      payload: { from: fromRef.current, cmd, v: PROTOCOL_VERSION },
    })
  }, [])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  useEffect(() => {
    if (!code) return
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!isRemoteConfigured()) {
      setStatus("error-config")
      return
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    const supabase = getSupabaseClient()
    const me = fromRef.current

    setStatus("connecting")
    setRemoteState({})
    const channel = supabase.channel(channelName(code), {
      config: { broadcast: { self: false }, presence: { key: me } }, // key=clientId so the booth detects our leave
    })
    channelRef.current = channel

    const markConnected = () => {
      clearTimeout(timeoutRef.current)
      setStatus("connected")
    }

    channel.on("broadcast", { event: "state" }, ({ payload }) => {
      if (!payload?.payload) return
      markConnected()
      setRemoteState((prev) =>
        mergeRemoteState(prev, payload.payload, localEditsRef.current, Date.now()),
      )
    })
    channel.on("broadcast", { event: "granted" }, ({ payload }) => {
      if (payload?.to === me) markConnected()
    })
    channel.on("broadcast", { event: "awaiting" }, ({ payload }) => {
      if (payload?.to === me) {
        clearTimeout(timeoutRef.current)
        setStatus("awaiting-approval")
      }
    })
    channel.on("broadcast", { event: "denied" }, ({ payload }) => {
      if (payload?.to === me) setStatus("denied")
    })
    channel.on("broadcast", { event: "occupied" }, ({ payload }) => {
      if (payload?.to === me) setStatus("occupied")
    })

    channel.subscribe((s) => {
      if (s === "SUBSCRIBED") {
        channel.track({ role: "controller" }) // presence so the booth can detect our leave
        channel.send({
          type: "broadcast",
          event: "hello",
          payload: { from: me, token: token || null, v: PROTOCOL_VERSION },
        })
        clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(
          () => setStatus((cur) => (cur === "connecting" ? "error-timeout" : cur)),
          CONNECT_TIMEOUT_MS,
        )
      } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") {
        setStatus("reconnecting")
      }
    })

    return () => {
      clearTimeout(timeoutRef.current)
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [code, token, attempt])

  return { status, send, remoteState, retry }
}