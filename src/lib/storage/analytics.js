import { get, set } from "idb-keyval"
import { logger } from "@/lib/logger"
import { CONVENTIONS, getConventionForDate } from "@/lib/config/presets"

/**
 * All date/time helpers work in the browser's local timezone — that matches
 * the wall-clock time the booth was operated in and what Discord renders.
 */
export function dateKey(ts) {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function hourOfDay(ts) {
  return new Date(ts).getHours()
}

export function formatClock(ts) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

const ANALYTICS_KEY = "analytics-events"

const listeners = new Set()

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

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
    listeners.forEach((fn) => fn())
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
  photos
    .filter((e) => e.mascotId)
    .forEach((e) => {
      mascotCounts[e.mascotId] = (mascotCounts[e.mascotId] || 0) + 1
    })

  // Layout popularity
  const layoutCounts = {}
  photos
    .filter((e) => e.layoutId)
    .forEach((e) => {
      layoutCounts[e.layoutId] = (layoutCounts[e.layoutId] || 0) + 1
    })

  const hourlyDistribution = Array(24).fill(0)
  photos.forEach((e) => {
    hourlyDistribution[hourOfDay(e.timestamp)]++
  })
  const peakHour =
    photoCount > 0 ? hourlyDistribution.indexOf(Math.max(...hourlyDistribution)) : null

  const dailyCounts = {}
  photos.forEach((e) => {
    const day = dateKey(e.timestamp)
    dailyCounts[day] = (dailyCounts[day] || 0) + 1
  })

  const dailyBreakdown = buildDailyBreakdown(events)

  // Event-grouped breakdown (photos taken inside a convention window)
  const eventBreakdown = buildEventBreakdown(dailyBreakdown)

  // Photos per session
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
    dailyBreakdown,
    eventBreakdown,
    mascotCounts,
    layoutCounts,
  }
}

/**
 * Build a per-day summary with rich metrics.
 * Returns an array sorted from newest to oldest.
 */
function buildDailyBreakdown(events) {
  const byDay = new Map()

  for (const e of events) {
    const day = dateKey(e.timestamp)
    if (!byDay.has(day)) {
      byDay.set(day, {
        date: day,
        photoCount: 0,
        singlePhotos: 0,
        stripPhotos: 0,
        stripCount: 0,
        discordSent: 0,
        discordQueued: 0,
        discordFailed: 0,
        gestureCaptures: 0,
        touchCaptures: 0,
        sessions: 0,
        mascotCounts: {},
        layoutCounts: {},
        hourlyDistribution: Array(24).fill(0),
        firstTimestamp: e.timestamp,
        lastTimestamp: e.timestamp,
      })
    }
    const d = byDay.get(day)
    d.firstTimestamp = Math.min(d.firstTimestamp, e.timestamp)
    d.lastTimestamp = Math.max(d.lastTimestamp, e.timestamp)

    if (e.type === "photo_captured") {
      d.photoCount++
      if (e.mode === "single") d.singlePhotos++
      if (e.mode === "strip") d.stripPhotos++
      if (e.trigger === "gesture") d.gestureCaptures++
      if (e.trigger === "touch") d.touchCaptures++
      if (e.mascotId) d.mascotCounts[e.mascotId] = (d.mascotCounts[e.mascotId] || 0) + 1
      if (e.layoutId) d.layoutCounts[e.layoutId] = (d.layoutCounts[e.layoutId] || 0) + 1
      d.hourlyDistribution[hourOfDay(e.timestamp)]++
    } else if (e.type === "strip_completed") d.stripCount++
    else if (e.type === "discord_sent") d.discordSent++
    else if (e.type === "discord_queued") d.discordQueued++
    else if (e.type === "discord_failed") d.discordFailed++
    else if (e.type === "session_start") d.sessions++
  }

  return Array.from(byDay.values())
    .map((d) => {
      const topMascot = Object.entries(d.mascotCounts).sort((a, b) => b[1] - a[1])[0]
      const topLayout = Object.entries(d.layoutCounts).sort((a, b) => b[1] - a[1])[0]
      const peakHour =
        d.photoCount > 0 ? d.hourlyDistribution.indexOf(Math.max(...d.hourlyDistribution)) : null
      const convention = getConventionForDate(d.date)
      return {
        ...d,
        topMascot: topMascot?.[0] || null,
        topLayout: topLayout?.[0] || null,
        peakHour,
        convention,
      }
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

/**
 * Aggregate per-day data by convention. Days not belonging to any
 * convention are grouped under a synthetic "other" entry.
 */
function buildEventBreakdown(dailyBreakdown) {
  const byConvention = new Map()

  for (const day of dailyBreakdown) {
    const slug = day.convention?.slug ?? null
    if (!slug) continue
    if (!byConvention.has(slug)) {
      byConvention.set(slug, {
        convention: day.convention,
        days: [],
        photoCount: 0,
        singlePhotos: 0,
        stripPhotos: 0,
        stripCount: 0,
        discordSent: 0,
        discordFailed: 0,
        gestureCaptures: 0,
        touchCaptures: 0,
        sessions: 0,
        mascotCounts: {},
        layoutCounts: {},
      })
    }
    const agg = byConvention.get(slug)
    agg.days.push(day)
    agg.photoCount += day.photoCount
    agg.singlePhotos += day.singlePhotos
    agg.stripPhotos += day.stripPhotos
    agg.stripCount += day.stripCount
    agg.discordSent += day.discordSent
    agg.discordFailed += day.discordFailed
    agg.gestureCaptures += day.gestureCaptures
    agg.touchCaptures += day.touchCaptures
    agg.sessions += day.sessions
    for (const [k, v] of Object.entries(day.mascotCounts)) {
      agg.mascotCounts[k] = (agg.mascotCounts[k] || 0) + v
    }
    for (const [k, v] of Object.entries(day.layoutCounts)) {
      agg.layoutCounts[k] = (agg.layoutCounts[k] || 0) + v
    }
  }

  // Include conventions that have no data yet (upcoming/past without photos)
  for (const c of CONVENTIONS) {
    if (!byConvention.has(c.slug)) continue
  }

  return Array.from(byConvention.values()).sort((a, b) =>
    a.convention.startDate < b.convention.startDate ? 1 : -1,
  )
}

/**
 * Escape a value for CSV (RFC 4180)
 */
function csvEscape(val) {
  const str = String(val)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Download a single CSV file with all events (type as a column)
 */
export async function downloadCsv() {
  const events = await getEvents()
  if (events.length === 0) return

  // Collect all columns across every event
  const colSet = new Set()
  events.forEach((e) =>
    Object.keys(e).forEach((k) => {
      if (k !== "timestamp") colSet.add(k)
    }),
  )
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
  const date = dateKey(Date.now())
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `dac-analytics-${date}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Parse a CSV string (RFC 4180) into an array of row objects.
 * Re-used by import from other machines.
 */
function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ""
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cell += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ",") {
      row.push(cell)
      cell = ""
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
    } else {
      cell += ch
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  const [headers, ...dataRows] = rows.filter((r) => r.some((c) => c !== ""))
  if (!headers) return []
  return dataRows.map((r) => {
    const obj = {}
    headers.forEach((h, idx) => {
      obj[h] = r[idx] ?? ""
    })
    return obj
  })
}

function coerceValue(key, value) {
  if (value === "" || value === undefined || value === null) return undefined
  if (key === "timestamp") {
    const t = Date.parse(value)
    return Number.isFinite(t) ? t : undefined
  }
  if (value === "true") return true
  if (value === "false") return false
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value)
  if (value.startsWith("{") || value.startsWith("[")) {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value
}

/**
 * Import analytics events from a CSV file produced by `downloadCsv`.
 * Merges with existing events, de-duplicating on (type + timestamp + signature).
 * @returns {Promise<{added: number, skipped: number, total: number}>}
 */
export async function importCsv(file) {
  const text = await file.text()
  const rawRows = parseCsv(text)
  if (rawRows.length === 0) return { added: 0, skipped: 0, total: 0 }

  const incoming = rawRows
    .map((row) => {
      const event = {}
      for (const [k, v] of Object.entries(row)) {
        const coerced = coerceValue(k, v)
        if (coerced !== undefined) event[k] = coerced
      }
      return event
    })
    .filter((e) => typeof e.type === "string" && typeof e.timestamp === "number")

  const existing = (await get(ANALYTICS_KEY)) || []
  const keyOf = (e) =>
    `${e.type}|${e.timestamp}|${e.mascotId ?? ""}|${e.layoutId ?? ""}|${e.mode ?? ""}|${e.trigger ?? ""}`
  const seen = new Set(existing.map(keyOf))

  let added = 0
  let skipped = 0
  for (const ev of incoming) {
    const k = keyOf(ev)
    if (seen.has(k)) {
      skipped++
      continue
    }
    seen.add(k)
    existing.push(ev)
    added++
  }

  existing.sort((a, b) => a.timestamp - b.timestamp)
  await set(ANALYTICS_KEY, existing)
  listeners.forEach((fn) => fn())

  return { added, skipped, total: incoming.length }
}

/**
 * Clear all analytics data
 */
export async function clearAnalytics() {
  await set(ANALYTICS_KEY, [])
  listeners.forEach((fn) => fn())
}
