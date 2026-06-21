"use client"

import { useEffect, useRef } from "react"
import { useUiStore } from "@/stores/uiStore"
import { useGalleryStore } from "@/stores/galleryStore"
import { getSupabaseClient, getRemotePassword } from "@/lib/remote/supabase"
import { applyCommand } from "@/lib/remote/commands"
import {
  PROTOCOL_VERSION,
  FIXED_CHANNEL,
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

function buildPayload() {
  const ui = useUiStore.getState()
  return {
    ...pickStatePayload(ui),
    galleryOpen: ui.modals.gallery,
    galleryIndex: ui.galleryLightboxIndex,
    galleryCount: useGalleryStore.getState().photos.length,
  }
}

// Booth side: always listening on the fixed channel whenever the app runs. No
// owner-lock and no approval — the password gates command execution. Broadcasts
// booth state (settings + gallery) to /admin, debounced + diffed.
export function useRemoteHost() {
  const channelRef = useRef(null)
  const lastSentRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) return // remote not configured — booth just runs without it
    const password = getRemotePassword()
    const authed = (payload) => !password || tokenMatch(payload?.pw, password)

    const channel = supabase.channel(FIXED_CHANNEL, { config: { broadcast: { self: false } } })
    channelRef.current = channel

    const pushState = (force) => {
      const payload = buildPayload()
      if (!force && shallowEqual(payload, lastSentRef.current)) return
      lastSentRef.current = payload
      channel.send({ type: "broadcast", event: "state", payload: { payload, v: PROTOCOL_VERSION } })
    }
    const schedulePush = () => {
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => pushState(false), STATE_DEBOUNCE_MS)
    }

    channel.on("broadcast", { event: "hello" }, ({ payload }) => {
      if (!authed(payload)) return
      lastSentRef.current = null
      pushState(true) // full snapshot so a (re)connecting admin gets current state
    })
    channel.on("broadcast", { event: "cmd" }, ({ payload }) => {
      if (!authed(payload)) return
      const cmd = validateCommand(payload?.cmd)
      if (cmd) applyCommand(useUiStore.getState(), cmd)
    })
    channel.subscribe()

    const unsubUi = useUiStore.subscribe(schedulePush)
    const unsubGallery = useGalleryStore.subscribe(schedulePush)

    return () => {
      unsubUi()
      unsubGallery()
      clearTimeout(debounceRef.current)
      supabase.removeChannel(channel)
      channelRef.current = null
      lastSentRef.current = null
    }
  }, [])
}
