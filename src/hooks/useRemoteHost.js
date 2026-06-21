"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useUiStore } from "@/stores/uiStore"
import { getSupabaseClient } from "@/lib/remote/supabase"
import { applyCommand } from "@/lib/remote/commands"
import {
  PROTOCOL_VERSION,
  channelName,
  generateRoomCode,
  generateClientId,
  pickStatePayload,
  tokenMatch,
  validateCommand,
} from "@/lib/remote/protocol"

const STATE_DEBOUNCE_MS = 60

function shallowEqual(a, b) {
  if (a === b) return true
  if (!a || !b) return false
  const ak = Object.keys(a)
  if (ak.length !== Object.keys(b).length) return false
  return ak.every((k) => a[k] === b[k])
}

export function useRemoteHost({ enabled }) {
  const [roomCode] = useState(generateRoomCode)
  const [token] = useState(generateClientId) // 24-byte secret used as the QR token
  const [status, setStatus] = useState("idle")
  const [pendingApproval, setPendingApproval] = useState(false)

  const channelRef = useRef(null)
  const ownerRef = useRef(null) // clientId of the active controller
  const pendingRef = useRef(null) // clientId awaiting manual approval
  const approvedRef = useRef(new Set()) // clientIds already approved (seamless reconnect)
  const lastSentRef = useRef(null)
  const debounceRef = useRef(null)

  const send = useCallback((event, payload) => {
    channelRef.current?.send({ type: "broadcast", event, payload })
  }, [])

  const pushState = useCallback(() => {
    if (!ownerRef.current) return
    const payload = pickStatePayload(useUiStore.getState())
    if (shallowEqual(payload, lastSentRef.current)) return
    lastSentRef.current = payload
    send("state", { payload, v: PROTOCOL_VERSION })
  }, [send])

  const schedulePush = useCallback(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(pushState, STATE_DEBOUNCE_MS)
  }, [pushState])

  const grant = useCallback(
    (to) => {
      ownerRef.current = to
      approvedRef.current.add(to)
      pendingRef.current = null
      setPendingApproval(false)
      setStatus("connected")
      useUiStore.getState().setRemoteConnected(true)
      send("granted", { to })
      lastSentRef.current = null
      pushState()
    },
    [send, pushState],
  )

  const approve = useCallback(() => {
    if (pendingRef.current) grant(pendingRef.current)
  }, [grant])
  const deny = useCallback(() => {
    if (pendingRef.current) send("denied", { to: pendingRef.current })
    pendingRef.current = null
    setPendingApproval(false)
    if (!ownerRef.current) setStatus("waiting")
  }, [send])

  useEffect(() => {
    if (!enabled) return
    const supabase = getSupabaseClient()
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!supabase) {
      setStatus("error")
      return
    }
    /* eslint-enable react-hooks/set-state-in-effect */

    const channel = supabase.channel(channelName(roomCode), {
      config: { broadcast: { self: false }, presence: { key: "booth" } },
    })
    channelRef.current = channel

    channel.on("broadcast", { event: "hello" }, ({ payload }) => {
      const from = payload?.from
      if (!from) return
      if (ownerRef.current && ownerRef.current !== from) {
        send("occupied", { to: from })
        return
      }
      // Already-approved clients (incl. token holders) reconnect seamlessly.
      if (approvedRef.current.has(from) || (payload.token && tokenMatch(payload.token, token))) {
        grant(from)
        return
      }
      // No/invalid token, first time => manual entry => require operator approval.
      pendingRef.current = from
      setPendingApproval(true)
      setStatus("awaiting-approval")
      send("awaiting", { to: from })
    })

    channel.on("broadcast", { event: "cmd" }, ({ payload }) => {
      if (!payload || payload.from !== ownerRef.current) return
      const cmd = validateCommand(payload.cmd)
      if (cmd) applyCommand(useUiStore.getState(), cmd)
    })

    channel.on("presence", { event: "leave" }, ({ key }) => {
      // The controller tracks presence with key = its clientId. When the owner
      // leaves (tab closed / dropped past reconnect), free ownership so a new
      // phone can pair instead of getting a stuck "occupied".
      if (key === ownerRef.current) {
        ownerRef.current = null
        lastSentRef.current = null
        setStatus("waiting")
        useUiStore.getState().setRemoteConnected(false)
      }
    })

    channel.subscribe((s) => {
      if (s === "SUBSCRIBED") {
        setStatus(ownerRef.current ? "connected" : "waiting")
        channel.track({ role: "booth" })
      } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") setStatus("error")
    })

    const unsub = useUiStore.subscribe(schedulePush)

    return () => {
      unsub()
      clearTimeout(debounceRef.current)
      supabase.removeChannel(channel)
      channelRef.current = null
      ownerRef.current = null
      pendingRef.current = null
      lastSentRef.current = null
      setPendingApproval(false)
      setStatus("idle")
      useUiStore.getState().setRemoteConnected(false)
    }
  }, [enabled, roomCode, token, grant, send, schedulePush])

  return { roomCode, token, status, pendingApproval, approve, deny }
}