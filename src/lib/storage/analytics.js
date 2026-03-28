import { get, set } from "idb-keyval"
import { logger } from "@/lib/logger"

const ANALYTICS_KEY = "analytics-events"

/**
 * @typedef {Object} AnalyticsEvent
 * @property {string} type - Event type (photo_captured, discord_sent, etc.)
 * @property {number} timestamp - Unix timestamp
 * @property {Record<string, any>} [data] - Optional event data
 */

/**
 * Track an analytics event
 * @param {string} type
 * @param {Record<string, any>} [data]
 */
export async function trackEvent(type, data = {}) {
  try {
    const events = (await get(ANALYTICS_KEY)) || []
    events.push({
      type,
      timestamp: Date.now(),
      ...data,
    })
    await set(ANALYTICS_KEY, events)
  } catch (err) {
    logger.warn("analytics", "Failed to track event", err)
  }
}

/**
 * Get all analytics events
 * @returns {Promise<AnalyticsEvent[]>}
 */
export async function getEvents() {
  try {
    return (await get(ANALYTICS_KEY)) || []
  } catch {
    return []
  }
}

/**
 * Get summary statistics
 * @returns {Promise<Object>}
 */
export async function getSummary() {
  const events = await getEvents()

  const photoCount = events.filter((e) => e.type === "photo_captured").length
  const discordSent = events.filter((e) => e.type === "discord_sent").length
  const discordFailed = events.filter((e) => e.type === "discord_failed").length
  const gestureCaptures = events.filter((e) => e.type === "photo_captured" && e.trigger === "gesture").length
  const touchCaptures = events.filter((e) => e.type === "photo_captured" && e.trigger === "touch").length

  // Mascot popularity
  const mascotCounts = {}
  events.filter((e) => e.type === "photo_captured" && e.mascotId).forEach((e) => {
    mascotCounts[e.mascotId] = (mascotCounts[e.mascotId] || 0) + 1
  })

  // Layout popularity
  const layoutCounts = {}
  events.filter((e) => e.type === "photo_captured" && e.layoutId).forEach((e) => {
    layoutCounts[e.layoutId] = (layoutCounts[e.layoutId] || 0) + 1
  })

  return {
    photoCount,
    discordSent,
    discordFailed,
    discordSuccessRate: discordSent + discordFailed > 0
      ? Math.round((discordSent / (discordSent + discordFailed)) * 100)
      : 0,
    gestureCaptures,
    touchCaptures,
    gestureRatio: photoCount > 0
      ? Math.round((gestureCaptures / photoCount) * 100)
      : 0,
    mascotCounts,
    layoutCounts,
  }
}

/**
 * Export all events as CSV
 * @returns {Promise<string>}
 */
export async function exportCsv() {
  const events = await getEvents()
  if (events.length === 0) return ""

  // Collect all unique keys across events
  const allKeys = new Set(["type", "timestamp"])
  events.forEach((e) => Object.keys(e).forEach((k) => allKeys.add(k)))
  const headers = Array.from(allKeys)

  const rows = events.map((e) =>
    headers.map((h) => {
      const val = e[h]
      if (val === undefined || val === null) return ""
      if (h === "timestamp") return new Date(val).toISOString()
      if (typeof val === "object") return JSON.stringify(val)
      return String(val)
    }).join(","),
  )

  return [headers.join(","), ...rows].join("\n")
}

/**
 * Download CSV file
 */
export async function downloadCsv() {
  const csv = await exportCsv()
  if (!csv) return

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `dac-photobooth-analytics-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Clear all analytics data
 */
export async function clearAnalytics() {
  await set(ANALYTICS_KEY, [])
}