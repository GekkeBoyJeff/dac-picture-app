"use client"

import { useState, useCallback, useRef } from "react"
import { TOAST_DURATION_MS, TOAST_ACTION_DURATION_MS } from "@/lib/config"

/**
 * @typedef {object} ToastAction
 * @property {string} label - Button text
 * @property {() => void} onClick - Action callback
 */

/**
 * @param {number} [duration]
 * @returns {{ message: string|null, action: ToastAction|null, show: (msg: string, action?: ToastAction) => void, dismiss: () => void }}
 */
export function useToast(duration = TOAST_DURATION_MS) {
  const [message, setMessage] = useState(null)
  const [action, setAction] = useState(null)
  const timerRef = useRef(undefined)

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMessage(null)
    setAction(null)
  }, [])

  const show = useCallback(
    (msg, toastAction = null) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      setMessage(msg)
      setAction(toastAction)
      const timeout = toastAction ? TOAST_ACTION_DURATION_MS : duration
      timerRef.current = setTimeout(() => {
        setMessage(null)
        setAction(null)
      }, timeout)
    },
    [duration],
  )

  return { message, action, show, dismiss }
}