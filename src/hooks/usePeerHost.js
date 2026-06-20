"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useUiStore } from "@/stores/uiStore"
import { scenePresets } from "@/components/drawers/settings/settingsPresets"

const PEER_PREFIX = "dac-photobooth-"
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const AUTH_TIMEOUT_MS = 8000

export function generateRoomCode() {
  const buf = new Uint32Array(4)
  crypto.getRandomValues(buf)
  return Array.from(buf, (n) => CODE_CHARS[n % CODE_CHARS.length]).join("")
}

function generateAuthToken() {
  const buf = new Uint8Array(24)
  crypto.getRandomValues(buf)
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

function tokenMatch(a, b) {
  if (!a || !b || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

function pickStatePayload(state) {
  return {
    stripModeEnabled: state.stripModeEnabled,
    flashEnabled: state.flashEnabled,
    gesturesEnabled: state.gesturesEnabled,
    debugEnabled: state.debugEnabled,
    forceLowPower: state.forceLowPower,
    lowPowerOverride: state.lowPowerOverride,
    detectionIntervalMs: state.detectionIntervalMs,
    numHands: state.numHands,
    minDetectionConfidence: state.minDetectionConfidence,
    minPresenceConfidence: state.minPresenceConfidence,
    minTrackingConfidence: state.minTrackingConfidence,
    triggerMinScore: state.triggerMinScore,
    gestureHoldMs: state.gestureHoldMs,
    appState: state.appState,
  }
}

export function usePeerHost({ streamRef, enabled }) {
  const [roomCode] = useState(generateRoomCode)
  const [authToken] = useState(generateAuthToken)
  const [status, setStatus] = useState("idle")
  const peerRef = useRef(null)
  const connRef = useRef(null)
  const callRef = useRef(null)

  const pushState = useCallback(() => {
    if (!connRef.current?.open) return
    connRef.current.send({ t: "state", payload: pickStatePayload(useUiStore.getState()) })
  }, [])

  const applyCommand = useCallback(
    (msg) => {
      const s = useUiStore.getState()
      switch (msg.t) {
        case "toggle":
          if (msg.key === "stripModeEnabled") s.toggleStripMode()
          else if (msg.key === "flashEnabled") s.toggleFlash()
          else if (msg.key === "gesturesEnabled") s.toggleGestures()
          else if (msg.key === "debugEnabled") s.toggleDebug()
          else if (msg.key === "forceLowPower") s.toggleForceLowPower()
          break
        case "set":
          if (msg.key === "detectionIntervalMs") s.setDetectionInterval(msg.value)
          else if (msg.key === "numHands") s.setNumHands(msg.value)
          else if (msg.key === "minDetectionConfidence") s.setMinDetectionConfidence(msg.value)
          else if (msg.key === "minPresenceConfidence") s.setMinPresenceConfidence(msg.value)
          else if (msg.key === "minTrackingConfidence") s.setMinTrackingConfidence(msg.value)
          else if (msg.key === "triggerMinScore") s.setTriggerScore(msg.value)
          else if (msg.key === "gestureHoldMs") s.setGestureHold(msg.value)
          break
        case "preset:scene": {
          const preset = scenePresets.find((p) => p.id === msg.id)
          if (preset) s.applyScenePreset(preset)
          break
        }
        case "preset:gesture":
          s.setDetectionInterval(msg.interval)
          s.setTriggerScore(msg.score)
          break
        case "preset:hold":
          s.setGestureHold(msg.ms)
          break
        case "preset:highPower":
          s.applyHighPowerPreset()
          break
        case "preset:lowPower":
          s.applyLowPowerPreset()
          break
        case "trigger":
          window.dispatchEvent(new CustomEvent("remote:trigger"))
          break
        case "modal":
          s.openModal(msg.name)
          break
        default:
          break
      }
      setTimeout(pushState, 30)
    },
    [pushState],
  )

  const startPeer = useCallback(async () => {
    if (peerRef.current) return
    const { Peer } = await import("peerjs")
    const peer = new Peer(PEER_PREFIX + roomCode)
    peerRef.current = peer

    peer.on("open", () => setStatus("waiting"))

    peer.on("connection", (conn) => {
      // Replace any previous connection
      connRef.current?.close()
      callRef.current?.close()
      connRef.current = conn

      let authenticated = false

      // Close unauthenticated connections after timeout
      const authTimeout = setTimeout(() => {
        if (!authenticated) conn.close()
      }, AUTH_TIMEOUT_MS)

      conn.on("data", (msg) => {
        if (!authenticated) {
          // First message must be { t: "auth", token: <expected> }
          if (msg?.t === "auth" && tokenMatch(msg.token, authToken)) {
            authenticated = true
            clearTimeout(authTimeout)
            setStatus("connected")
            useUiStore.getState().setRemoteConnected(true)
            pushState()
            const stream = streamRef.current
            if (stream) {
              callRef.current = peer.call(conn.peer, stream)
            }
          } else {
            clearTimeout(authTimeout)
            conn.close()
          }
          return
        }
        applyCommand(msg)
      })

      const handleDisconnect = () => {
        clearTimeout(authTimeout)
        callRef.current?.close()
        connRef.current = null
        callRef.current = null
        setStatus("waiting")
        useUiStore.getState().setRemoteConnected(false)
      }
      conn.on("close", handleDisconnect)
      conn.on("error", handleDisconnect)
    })

    peer.on("error", () => setStatus("error"))
  }, [roomCode, authToken, pushState, applyCommand, streamRef])

  const stopPeer = useCallback(() => {
    callRef.current?.close()
    connRef.current?.close()
    peerRef.current?.destroy()
    callRef.current = null
    connRef.current = null
    peerRef.current = null
    setStatus("idle")
    useUiStore.getState().setRemoteConnected(false)
  }, [])

  useEffect(() => {
    if (!enabled) return
    startPeer()
    return stopPeer
  }, [enabled, startPeer, stopPeer])

  // Broadcast every store change to authenticated remote
  useEffect(() => {
    if (!enabled) return
    return useUiStore.subscribe(pushState)
  }, [enabled, pushState])

  return { roomCode, authToken, status }
}
