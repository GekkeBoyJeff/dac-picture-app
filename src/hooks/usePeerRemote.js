"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { PEER_CONFIG } from "@/lib/webrtc/iceServers"

const PEER_PREFIX = "dac-photobooth-"

export function usePeerRemote({ code, authToken, onState }) {
  const [status, setStatus] = useState("idle")
  const [remoteStream, setRemoteStream] = useState(null)
  const peerRef = useRef(null)
  const connRef = useRef(null)

  const send = useCallback((msg) => {
    if (connRef.current?.open) {
      try {
        connRef.current.send(msg)
      } catch {}
    }
  }, [])

  const connect = useCallback(
    async (roomCode, token) => {
      const normalized = (roomCode || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 4)
      if (normalized.length !== 4) return

      setStatus("connecting")
      setRemoteStream(null)

      try {
        const { Peer } = await import("peerjs")

        if (peerRef.current) {
          peerRef.current.destroy()
          peerRef.current = null
        }

        const peer = new Peer(undefined, PEER_CONFIG)
        peerRef.current = peer

        peer.on("disconnected", () => {
          if (peerRef.current === peer && !peer.destroyed) {
            try {
              peer.reconnect()
            } catch {}
          }
        })

        peer.on("open", () => {
          const conn = peer.connect(PEER_PREFIX + normalized, { reliable: true })
          connRef.current = conn

          conn.on("open", () => {
            // Always send the auth handshake first (token from the QR link if we
            // have one; null for manual code entry). The host requires this
            // message before accepting any commands.
            conn.send({ t: "auth", token: token || null })
          })

          conn.on("data", (msg) => {
            if (msg?.t === "state") {
              // First state message confirms auth was accepted
              setStatus("connected")
              onState(msg.payload)
            }
          })

          const handleClose = () => {
            connRef.current = null
            setStatus("disconnected")
          }
          conn.on("close", handleClose)
          conn.on("error", handleClose)
        })

        peer.on("call", (call) => {
          call.answer()
          call.on("stream", (stream) => setRemoteStream(stream))
          call.on("close", () => setRemoteStream(null))
        })

        peer.on("error", () => setStatus("disconnected"))
      } catch {
        setStatus("disconnected")
      }
    },
    [onState],
  )

  useEffect(() => {
    if (!code) return
    connect(code, authToken)
    return () => {
      connRef.current?.close()
      peerRef.current?.destroy()
      connRef.current = null
      peerRef.current = null
    }
  }, [code, authToken, connect])

  return { status, send, remoteStream }
}
