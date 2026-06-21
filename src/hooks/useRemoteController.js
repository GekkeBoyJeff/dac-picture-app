"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getSupabaseClient, isRemoteConfigured, getRemotePassword } from "@/lib/remote/supabase"
import { PROTOCOL_VERSION, FIXED_CHANNEL, mergeRemoteState } from "@/lib/remote/protocol"

const CONNECT_TIMEOUT_MS = 10000

// /admin side. Joins the fixed channel, announces itself with the password, and
// receives booth state. No owner-lock/approval — close & reopen always works.
export function useRemoteController({ enabled = true } = {}) {
  const [status, setStatus] = useState("idle")
  const [remoteState, setRemoteState] = useState({})
  const [attempt, setAttempt] = useState(0)

  const channelRef = useRef(null)
  const localEditsRef = useRef({})
  const timeoutRef = useRef(null)

  const send = useCallback((cmd) => {
    if (cmd?.t === "set" || cmd?.t === "toggle") localEditsRef.current[cmd.key] = Date.now()
    channelRef.current?.send({
      type: "broadcast",
      event: "cmd",
      payload: { pw: getRemotePassword(), cmd, v: PROTOCOL_VERSION },
    })
  }, [])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  useEffect(() => {
    if (!enabled) return
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!isRemoteConfigured()) {
      setStatus("error-config")
      return
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    const supabase = getSupabaseClient()
    setStatus("connecting")
    setRemoteState({})

    const channel = supabase.channel(FIXED_CHANNEL, { config: { broadcast: { self: false } } })
    channelRef.current = channel

    const hello = () =>
      channel.send({
        type: "broadcast",
        event: "hello",
        payload: { pw: getRemotePassword(), v: PROTOCOL_VERSION },
      })

    channel.on("broadcast", { event: "state" }, ({ payload }) => {
      if (!payload?.payload) return
      clearTimeout(timeoutRef.current)
      setStatus("connected")
      setRemoteState((prev) =>
        mergeRemoteState(prev, payload.payload, localEditsRef.current, Date.now()),
      )
    })

    channel.subscribe((s) => {
      if (s === "SUBSCRIBED") {
        hello() // ask the booth for a full snapshot (fires again on auto-reconnect)
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
  }, [enabled, attempt])

  return { status, send, remoteState, retry }
}