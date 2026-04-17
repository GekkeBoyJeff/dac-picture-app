import { get, set } from "idb-keyval"
import { logger } from "@/lib/logger"

const ANALYTICS_KEY = "analytics-events"

/**
 * Track an analytics event.
 * @param {string} type - Event type (photo_captured, discord_sent, etc.)
 * @param {Record<string, *>} [data]
 */
export async function trackEvent(type, data = {}) {
  try {
    const events = (await get(ANALYTICS_KEY)) || []
    const updated = [...events, { type, timestamp: Date.now(), ...data }]
    await set(ANALYTICS_KEY, updated)
  } catch (err) {
    logger.warn("analytics", "Failed to track event", err)
  }
}

/**
 * Get summary statistics from all stored events.
 * @returns {Promise<object>}
 */
export async function getAnalyticsSummary() {
  const events = await getEvents()

  const photos = events.filter((e) => e.type === "photo_captured")
  const photoCount = photos.length
  const singlePhotos = photos.filter((e) => e.mode === "single").length
  const stripPhotos = photos.filter((e) => e.mode === "strip").length
  const stripCount = events.filter((e) => e.type === "strip_completed").length

  const discordSent = events.filter((e) => e.type === "discord_sent").length
  const discordQueued = events.filter((e) => e.type === "discord_queued").length
  const discordFailed = events.filter((e) => e.type === "discord_failed").length
  const discordTotal = discordSent + discordFailed + discordQueued

  const gestureCaptures = photos.filter((e) => e.trigger === "gesture").length
  const touchCaptures = photos.filter((e) => e.trigger === "touch").length

  const sessions = events.filter((e) => e.type === "session_start").length

  // Mascot popularity
  const mascotCounts = {}
  for (const e of photos.filter((p) => p.mascotId)) {
    mascotCounts[e.mascotId] = (mascotCounts[e.mascotId] || 0) + 1
  }

  // Layout popularity
  const layoutCounts = {}
  for (const e of photos.filter((p) => p.layoutId)) {
    layoutCounts[e.layoutId] = (layoutCounts[e.layoutId] || 0) + 1
  }

  // Hourly distribution (0-23)
  const hourlyDistribution = Array(24).fill(0)
  for (const e of photos) {
    const hour = new Date(e.timestamp).getHours()
    hourlyDistribution[hour]++
  }
  const peakHour =
    photoCount > 0 ? hourlyDistribution.indexOf(Math.max(...hourlyDistribution)) : null

  // Daily breakdown (date string -> count)
  const dailyCounts = {}
  for (const e of photos) {
    const day = new Date(e.timestamp).toISOString().slice(0, 10)
    dailyCounts[day] = (dailyCounts[day] || 0) + 1
  }

  const photosPerSession = sessions > 0 ? Math.round(photoCount / sessions) : 0

  return {
    photoCount,
    singlePhotos,
    stripPhotos,
    stripCount,
    discordSent,
    discordQueued,
    discordFailed,
    discordSuccessRate: discordTotal > 0 ? Math.round((discordSent / discordTotal) * 100) : 0,
    gestureCaptures,
    touchCaptures,
    gestureRatio: photoCount > 0 ? Math.round((gestureCaptures / photoCount) * 100) : 0,
    sessions,
    photosPerSession,
    peakHour,
    hourlyDistribution,
    dailyCounts,
    mascotCounts,
    layoutCounts,
  }
}

/**
 * Download all events as a single CSV file.
 */
export async function downloadAnalyticsCsv() {
  const events = await getEvents()
  if (events.length === 0) return

  // Collect all columns across every event
  const colSet = new Set()
  for (const e of events) {
    for (const k of Object.keys(e)) {
      if (k !== "timestamp") colSet.add(k)
    }
  }
  const headers = [
    "timestamp",
    "type",
    ...Array.from(colSet)
      .filter((c) => c !== "type")
      .sort(),
  ]

  const rows = events.map((e) =>
    headers
      .map((h) => {
        const val = e[h]
        if (val === undefined || val === null) return ""
        if (h === "timestamp") return new Date(val).toISOString()
        if (typeof val === "object") return csvEscape(JSON.stringify(val))
        return csvEscape(val)
      })
      .join(","),
  )

  const csv = [headers.join(","), ...rows].join("\n")
  const date = new Date().toISOString().slice(0, 10)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `dac-analytics-${date}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Clear all analytics data.
 */
export async function clearAnalytics() {
  await set(ANALYTICS_KEY, [])
}

// -- Internal helpers --

async function getEvents() {
  try {
    return (await get(ANALYTICS_KEY)) || []
  } catch {
    return []
  }
}

function csvEscape(val) {
  const str = String(val)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}`
  }
  return str
}