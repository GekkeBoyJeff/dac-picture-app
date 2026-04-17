export const STORAGE_KEYS = {
  INSTALL_PROMPT_DISMISSED_AT: "pwa-install-dismissed",
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

export function readStorage(key, fallback = null) {
  if (!canUseStorage()) return fallback
  try {
    const value = localStorage.getItem(key)
    return value === null ? fallback : value
  } catch {
    return fallback
  }
}

export function writeStorage(key, value) {
  if (!canUseStorage()) return false
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function removeStorage(key) {
  if (!canUseStorage()) return false
  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export function readJsonStorage(key, fallback) {
  const raw = readStorage(key, null)
  if (raw === null) return fallback

  try {
    return JSON.parse(raw)
  } catch {
    removeStorage(key)
    return fallback
  }
}

export function writeJsonStorage(key, value) {
  try {
    return writeStorage(key, JSON.stringify(value))
  } catch {
    return false
  }
}