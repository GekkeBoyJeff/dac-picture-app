"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { sendToDiscord } from "@/lib/sendToDiscord"
import { STORAGE_KEYS, readJsonStorage, writeJsonStorage } from "@/lib/storage/localStorage"
const MAX_BACKOFF_MS = 15000
const BASE_BACKOFF_MS = 1200

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        reject(new Error("Kon blob niet converteren"))
      }
    }
    reader.onerror = () => reject(new Error("Blob lezen mislukt"))
    reader.readAsDataURL(blob)
  })
}

function dataUrlToBlob(dataUrl) {
  const [meta, data] = dataUrl.split(",")
  const mimeMatch = meta.match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : "image/webp"
  const binary = atob(data)
  const len = binary.length
  const buffer = new Uint8Array(len)
  for (let i = 0; i < len; i += 1) buffer[i] = binary.charCodeAt(i)
  return new Blob([buffer], { type: mime })
}

export function useSendQueue() {
  const [queue, setQueue] = useState(() => readJsonStorage(STORAGE_KEYS.SEND_QUEUE, []))
  const [sendingId, setSendingId] = useState(null)
  const [isImmediateSending, setIsImmediateSending] = useState(false)
  const [retrySignal, setRetrySignal] = useState(0)

  useEffect(() => {
    writeJsonStorage(STORAGE_KEYS.SEND_QUEUE, queue)
  }, [queue])

  const failedCount = queue.filter((item) => item.failed).length

  const processFirst = useCallback(async (item) => {
    setSendingId(item.id)
    try {
      const blob = dataUrlToBlob(item.dataUrl)
      const ok = await sendToDiscord(blob)

      setQueue((prev) => {
        const current = prev[0]
        if (!current || current.id !== item.id) return prev
        if (ok) return prev.slice(1)
        const attempts = (current.attempts ?? 0) + 1
        const updated = { ...current, attempts, lastAttempt: Date.now(), failed: false }
        return [{ ...updated }, ...prev.slice(1)]
      })
    } finally {
      setSendingId(null)
    }
  }, [])

  useEffect(() => {
    if (sendingId || queue.length === 0) return
    const first = queue[0]

    const attempts = first.attempts ?? 0
    const delay = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS + attempts * BASE_BACKOFF_MS)

    const timer = setTimeout(() => processFirst(first), delay)
    return () => clearTimeout(timer)
  }, [queue, sendingId, processFirst, retrySignal])

  useEffect(() => {
    const handler = () => setRetrySignal((v) => v + 1)
    window.addEventListener("online", handler)
    return () => window.removeEventListener("online", handler)
  }, [])

  const sendWithQueue = useCallback(async (blob, fallbackDataUrl) => {
    setIsImmediateSending(true)
    try {
      const shouldSkipImmediate = typeof navigator !== "undefined" && navigator.onLine === false
      if (!shouldSkipImmediate) {
        const ok = await sendToDiscord(blob)
        if (ok) return { success: true, queued: false }
      }

      const dataUrl = fallbackDataUrl || await blobToDataUrl(blob)
      const entry = {
        id: `send-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        dataUrl,
        attempts: 0,
        failed: false,
        lastAttempt: Date.now(),
      }
      setQueue((prev) => [...prev, entry])
      return { success: false, queued: true }
    } catch {
      return { success: false, queued: false }
    } finally {
      setIsImmediateSending(false)
    }
  }, [])

  const isProcessingQueue = useMemo(() => sendingId !== null, [sendingId])
  const pendingCount = useMemo(() => queue.length, [queue.length])

  return {
    sendWithQueue,
    isImmediateSending,
    isProcessingQueue,
    pendingCount,
    failedCount,
  }
}