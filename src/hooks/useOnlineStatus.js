"use client"

import { useSyncExternalStore } from "react"

function subscribeToOnline(callback) {
  window.addEventListener("online", callback)
  window.addEventListener("offline", callback)
  return () => {
    window.removeEventListener("online", callback)
    window.removeEventListener("offline", callback)
  }
}

function getOnlineSnapshot() {
  return navigator.onLine
}

function getServerSnapshot() {
  return true
}

/**
 * Reactive wrapper around navigator.onLine.
 * Listens to online/offline events and returns the current status.
 *
 * @returns {boolean}
 */
export function useOnlineStatus() {
  return useSyncExternalStore(subscribeToOnline, getOnlineSnapshot, getServerSnapshot)
}