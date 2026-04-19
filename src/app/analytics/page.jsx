"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  getEvents,
  getSummary,
  downloadCsv,
  importCsv,
  clearAnalytics,
  subscribe,
  dateKey,
  formatClock,
} from "@/lib/storage/analytics"

const TABS = [
  { id: "overview", label: "Overzicht" },
  { id: "days", label: "Per dag" },
  { id: "events", label: "Events" },
  { id: "sessions", label: "Sessies" },
]

const CARD = "rounded-xl border border-white/10 bg-white/[0.04]"
const CARD_PAD = `${CARD} p-4`
const DOW = ["zo", "ma", "di", "wo", "do", "vr", "za"]

export default function AnalyticsPage() {
  const [summary, setSummary] = useState(null)
  const [events, setEvents] = useState([])
  const [tab, setTab] = useState("overview")
  const [importStatus, setImportStatus] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const refresh = () => {
      Promise.all([getSummary(), getEvents()]).then(([s, e]) => {
        setSummary(s)
        setEvents(e)
      })
    }
    refresh()
    return subscribe(refresh)
  }, [])

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    try {
      const result = await importCsv(file)
      setImportStatus({
        kind: "ok",
        message: `Geïmporteerd: ${result.added} nieuw · ${result.skipped} overgeslagen`,
      })
    } catch (err) {
      setImportStatus({ kind: "err", message: `Import mislukt: ${err?.message || "onbekend"}` })
    }
    setTimeout(() => setImportStatus(null), 5000)
  }

  const handleClear = async () => {
    if (!confirm("Weet je zeker dat je alle analytics wilt wissen?")) return
    await clearAnalytics()
  }

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black text-white">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/10"
            >
              ← Terug
            </Link>
            <div>
              <h1 className="text-xl font-semibold md:text-2xl">Analytics</h1>
              <p className="text-xs text-white/50">Volledig lokaal overzicht van de photobooth</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/70 transition-colors hover:bg-white/10"
            >
              Importeer CSV
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/70 transition-colors hover:bg-white/10"
            >
              Exporteer CSV
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300/70 transition-colors hover:bg-red-400/10"
            >
              Wissen
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </header>

        {importStatus && (
          <p
            className={`mb-4 text-xs ${
              importStatus.kind === "ok" ? "text-emerald-300/80" : "text-red-300/80"
            }`}
          >
            {importStatus.message}
          </p>
        )}

        <nav className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                tab === t.id ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {!summary && <p className="text-white/50 text-sm">Laden…</p>}
        {summary && summary.photoCount === 0 && events.length === 0 && (
          <p className="text-white/50 text-sm">Nog geen data — neem wat foto&apos;s.</p>
        )}

        {summary && tab === "overview" && <OverviewTab summary={summary} />}
        {summary && tab === "days" && <DaysTab summary={summary} events={events} />}
        {summary && tab === "events" && <EventsTab summary={summary} events={events} />}
        {summary && tab === "sessions" && <SessionsTab events={events} />}
      </div>
    </div>
  )
}

/* ------------------------------ OVERVIEW ------------------------------ */

function OverviewTab({ summary }) {
  const topMascot = Object.entries(summary.mascotCounts).sort((a, b) => b[1] - a[1])[0]
  const topLayout = Object.entries(summary.layoutCounts).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <BigStat
          label="Foto's"
          value={summary.photoCount}
          sub={`${summary.singlePhotos} enkel · ${summary.stripPhotos} strip`}
        />
        <BigStat label="Strips" value={summary.stripCount} sub={`${summary.sessions} sessies`} />
        <BigStat
          label="Verzonden naar Discord"
          value={`${summary.discordSent}/${summary.discordSent + summary.discordFailed + summary.discordQueued}`}
          sub={discordSubtitle(summary)}
        />
        <BigStat
          label="Trigger"
          value={`${summary.gestureCaptures}/${summary.gestureCaptures + summary.touchCaptures}`}
          sub={`gesture · rest (${summary.touchCaptures}) via touch`}
        />
        <BigStat
          label="Top mascotte"
          value={topMascot?.[0] || "-"}
          sub={topMascot ? `${topMascot[1]} foto's` : undefined}
        />
        <BigStat
          label="Top layout"
          value={topLayout?.[0] || "-"}
          sub={topLayout ? `${topLayout[1]} foto's` : undefined}
        />
      </section>

      <HourHeatmap dailyBreakdown={summary.dailyBreakdown} />

      <div className="grid gap-4 md:grid-cols-2">
        <BreakdownCard title="Mascottes" counts={summary.mascotCounts} total={summary.photoCount} />
        <BreakdownCard title="Layouts" counts={summary.layoutCounts} total={summary.photoCount} />
      </div>
    </div>
  )
}

function BigStat({ label, value, sub }) {
  return (
    <div className={CARD_PAD}>
      <p className="text-[0.65rem] uppercase tracking-[0.16em] text-white/45">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-white/50">{sub}</p>}
    </div>
  )
}

function BreakdownCard({ title, counts, total }) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) {
    return (
      <div className={CARD_PAD}>
        <p className="text-xs uppercase tracking-[0.16em] text-white/45">{title}</p>
        <p className="mt-2 text-sm text-white/40">Geen data</p>
      </div>
    )
  }
  return (
    <div className={CARD_PAD}>
      <p className="mb-3 text-xs uppercase tracking-[0.16em] text-white/45">{title}</p>
      <ul className="space-y-2">
        {entries.map(([id, count]) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <li key={id}>
              <div className="flex items-center justify-between text-sm">
                <span className="truncate text-white/85">{id}</span>
                <span className="text-white/50 text-xs">
                  {count} · {pct}%
                </span>
              </div>
              <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-300/60 to-amber-200/80"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function discordSubtitle(s) {
  const total = s.discordSent + s.discordFailed + s.discordQueued
  if (total === 0) return "nog niets verzonden"
  const parts = [`${s.discordFailed} mislukt`]
  if (s.discordQueued > 0) parts.unshift(`${s.discordQueued} in wachtrij`)
  return parts.join(" · ")
}

/**
 * Heatmap with rows = last N dates, cols = 24 hours + day totals.
 */
function HourHeatmap({ dailyBreakdown }) {
  const rows = useMemo(() => dailyBreakdown.slice(0, 14), [dailyBreakdown])
  const max = Math.max(1, ...rows.flatMap((d) => d.hourlyDistribution))
  if (rows.length === 0) return null

  return (
    <div className={CARD_PAD}>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-[0.16em] text-white/45">Activiteit per uur</p>
        <p className="text-[0.65rem] text-white/35">laatste {rows.length} dagen</p>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[32rem]">
          <div className="grid grid-cols-[5rem_1fr_3rem] gap-2 text-[0.6rem] text-white/35 mb-1">
            <div />
            <div
              className="grid gap-px"
              style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
            >
              {Array.from({ length: 24 }).map((_, h) => (
                <span key={h} className="text-center">
                  {h % 3 === 0 ? h : ""}
                </span>
              ))}
            </div>
            <span className="text-right">totaal</span>
          </div>
          {rows.map((day) => (
            <div key={day.date} className="grid grid-cols-[5rem_1fr_3rem] gap-2 items-center mb-px">
              <div className="text-[0.65rem] text-white/60 truncate">
                {formatShortDate(day.date)}
              </div>
              <div
                className="grid gap-px"
                style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}
              >
                {day.hourlyDistribution.map((c, h) => (
                  <div
                    key={h}
                    className="h-4 rounded-sm"
                    style={{
                      backgroundColor:
                        c === 0
                          ? "rgba(255,255,255,0.04)"
                          : `rgba(251, 191, 36, ${0.2 + (c / max) * 0.8})`,
                    }}
                    title={`${day.date} ${h}:00 — ${c} foto's`}
                  />
                ))}
              </div>
              <span className="text-right text-xs font-medium text-white/80 tabular-nums">
                {day.photoCount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------ DAYS ------------------------------ */

function DaysTab({ summary, events }) {
  if (summary.dailyBreakdown.length === 0)
    return <p className="text-white/50 text-sm">Nog geen dagdata.</p>

  return (
    <div className="space-y-3">
      {summary.dailyBreakdown.map((day) => (
        <DayDetail key={day.date} day={day} events={events} />
      ))}
    </div>
  )
}

function DayDetail({ day, events }) {
  const [open, setOpen] = useState(false)
  const photoTimestamps = useMemo(
    () =>
      events
        .filter((e) => e.type === "photo_captured" && dateKey(e.timestamp) === day.date)
        .map((e) => e.timestamp)
        .sort((a, b) => a - b),
    [events, day.date],
  )
  const firstPhoto = photoTimestamps[0]
  const lastPhoto = photoTimestamps[photoTimestamps.length - 1]
  const dayStart = day.firstTimestamp
  const dayEnd = day.lastTimestamp

  return (
    <div className={`${CARD} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">
            {formatLongDate(day.date)}
            {day.convention && (
              <span className="ml-2 text-xs font-medium text-amber-200/85">
                {day.convention.name}
              </span>
            )}
          </p>
          <p className="text-xs text-white/45">
            {day.photoCount} foto&apos;s · {day.sessions} sessies
            {dayStart &&
              dayEnd &&
              dayStart !== dayEnd &&
              ` · ${formatClock(dayStart)}–${formatClock(dayEnd)}`}
          </p>
        </div>
        <span className="text-white/40 text-lg leading-none" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-white/5 px-4 py-4">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <MiniStat label="Enkel" value={day.singlePhotos} />
            <MiniStat
              label="Strip"
              value={`${day.stripPhotos}`}
              sub={`${day.stripCount} compleet`}
            />
            <MiniStat
              label="Verzonden"
              value={`${day.discordSent}/${day.discordSent + day.discordFailed + day.discordQueued}`}
              sub={`${day.discordFailed} mislukt${day.discordQueued ? ` · ${day.discordQueued} wachtrij` : ""}`}
            />
            <MiniStat
              label="Trigger"
              value={`${day.gestureCaptures}/${day.photoCount}`}
              sub={`gesture · ${day.touchCaptures} touch`}
            />
            <MiniStat
              label="Start"
              value={dayStart ? formatClock(dayStart) : "-"}
              sub={
                firstPhoto && firstPhoto !== dayStart
                  ? `eerste foto ${formatClock(firstPhoto)}`
                  : undefined
              }
            />
            <MiniStat
              label="Einde"
              value={dayEnd ? formatClock(dayEnd) : "-"}
              sub={
                lastPhoto && lastPhoto !== dayEnd
                  ? `laatste foto ${formatClock(lastPhoto)}`
                  : undefined
              }
            />
            <MiniStat label="Piekuur" value={day.peakHour !== null ? `${day.peakHour}:00` : "-"} />
            <MiniStat
              label="Duur"
              value={dayStart && dayEnd ? formatDuration(dayEnd - dayStart) : "-"}
            />
          </div>

          <HourBars data={day.hourlyDistribution} />

          <div className="grid gap-3 md:grid-cols-2">
            <BreakdownCard title="Mascottes" counts={day.mascotCounts} total={day.photoCount} />
            <BreakdownCard title="Layouts" counts={day.layoutCounts} total={day.photoCount} />
          </div>
        </div>
      )}
    </div>
  )
}

function HourBars({ data }) {
  const max = Math.max(...data, 1)
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/45">Uurverdeling</p>
      <div className="flex h-16 items-end gap-px">
        {data.map((count, hour) => (
          <div
            key={hour}
            className="flex-1 rounded-t-sm bg-gradient-to-t from-sky-300/40 to-amber-200/80"
            style={{
              height: `${(count / max) * 100}%`,
              opacity: count > 0 ? 0.5 + (count / max) * 0.5 : 0.08,
            }}
            title={`${hour}:00 — ${count} foto's`}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[0.6rem] text-white/30">
        <span>0:00</span>
        <span>6:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:59</span>
      </div>
    </div>
  )
}

function TimeDots({ timestamps, dayIso }) {
  const dayStart = new Date(`${dayIso}T00:00:00`).getTime()
  const DAY_MS = 24 * 60 * 60 * 1000
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/45">
        Fototijden ({timestamps.length})
      </p>
      <div className="relative h-6 rounded-md bg-white/[0.03] border border-white/5">
        {timestamps.map((t, i) => {
          const pct = Math.max(0, Math.min(1, (t - dayStart) / DAY_MS)) * 100
          return (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 h-3 w-0.5 bg-amber-200/80"
              style={{ left: `${pct}%` }}
              title={formatClock(t)}
            />
          )
        })}
      </div>
    </div>
  )
}

function MiniStat({ label, value, sub }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
      <p className="text-[0.6rem] uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p className="mt-0.5 text-base font-semibold text-white">{value}</p>
      {sub && <p className="text-[0.65rem] text-white/45">{sub}</p>}
    </div>
  )
}

/* ------------------------------ EVENTS ------------------------------ */

function EventsTab({ summary, events }) {
  if (summary.eventBreakdown.length === 0)
    return (
      <p className="text-white/50 text-sm">
        Nog geen foto&apos;s tijdens een conventie. Zodra datums overeenkomen met een geregistreerd
        event verschijnt dat hier automatisch.
      </p>
    )

  return (
    <div className="space-y-6">
      {summary.eventBreakdown.map((event) => (
        <EventDetail key={event.convention.slug} event={event} events={events} />
      ))}
    </div>
  )
}

function EventDetail({ event, events }) {
  const { convention, days } = event
  const topMascot = Object.entries(event.mascotCounts).sort((a, b) => b[1] - a[1])[0]
  const topLayout = Object.entries(event.layoutCounts).sort((a, b) => b[1] - a[1])[0]

  return (
    <article className={`${CARD} overflow-hidden`}>
      <header className="flex items-center gap-4 border-b border-white/5 bg-white/[0.02] px-5 py-4">
        <div className="relative h-16 w-28 shrink-0 rounded-lg bg-white/5 overflow-hidden">
          <Image
            src={convention.bannerPath}
            alt={convention.name}
            fill
            sizes="112px"
            className="object-contain p-1.5"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-white truncate">{convention.name}</h2>
          <p className="text-xs text-white/45">
            {formatLongDate(convention.startDate)} – {formatLongDate(convention.endDate)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-white">{event.photoCount}</p>
          <p className="text-[0.65rem] uppercase tracking-[0.16em] text-white/40">foto&apos;s</p>
        </div>
      </header>

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniStat label="Enkel" value={event.singlePhotos} />
          <MiniStat label="Strip" value={event.stripPhotos} sub={`${event.stripCount} compleet`} />
          <MiniStat
            label="Verzonden"
            value={`${event.discordSent}/${event.discordSent + event.discordFailed}`}
            sub={`${event.discordFailed} mislukt`}
          />
          <MiniStat
            label="Trigger"
            value={`${event.gestureCaptures}/${event.photoCount}`}
            sub={`gesture · ${event.touchCaptures} touch`}
          />
          <MiniStat label="Sessies" value={event.sessions} />
          <MiniStat label="Dagen" value={days.length} />
          <MiniStat
            label="Top mascotte"
            value={topMascot?.[0] || "-"}
            sub={topMascot ? `${topMascot[1]}×` : undefined}
          />
          <MiniStat
            label="Top layout"
            value={topLayout?.[0] || "-"}
            sub={topLayout ? `${topLayout[1]}×` : undefined}
          />
        </div>

        <div className="space-y-2">
          {days.map((d) => (
            <DayDetail key={d.date} day={d} events={events} />
          ))}
        </div>
      </div>
    </article>
  )
}

/* ------------------------------ SESSIONS ------------------------------ */

function SessionsTab({ events }) {
  const sessions = useMemo(() => buildSessions(events), [events])
  if (sessions.length === 0) return <p className="text-white/50 text-sm">Nog geen sessies.</p>

  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="grid grid-cols-[7rem_5rem_5rem_1fr] gap-2 border-b border-white/10 px-4 py-2 text-[0.65rem] uppercase tracking-[0.14em] text-white/45">
        <span>Start</span>
        <span>Duur</span>
        <span>Foto&apos;s</span>
        <span>Detail</span>
      </div>
      <ul>
        {sessions.map((s) => (
          <li
            key={s.start}
            className="grid grid-cols-[7rem_5rem_5rem_1fr] gap-2 border-b border-white/5 px-4 py-2 text-sm last:border-b-0"
          >
            <span className="text-white/80">{formatShortDateTime(s.start)}</span>
            <span className="text-white/60">{formatDuration(s.duration)}</span>
            <span className="text-white/80">{s.photoCount}</span>
            <span className="text-xs text-white/50">
              {s.singlePhotos} enkel · {s.stripPhotos} strip · {s.discordSent} discord
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function buildSessions(events) {
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp)
  const sessions = []
  let current = null
  const SESSION_GAP_MS = 10 * 60 * 1000

  for (const e of sorted) {
    if (e.type === "session_start" || !current || e.timestamp - current.last > SESSION_GAP_MS) {
      current = {
        start: e.timestamp,
        last: e.timestamp,
        duration: 0,
        photoCount: 0,
        singlePhotos: 0,
        stripPhotos: 0,
        discordSent: 0,
      }
      sessions.push(current)
    }
    current.last = e.timestamp
    current.duration = current.last - current.start
    if (e.type === "photo_captured") {
      current.photoCount++
      if (e.mode === "single") current.singlePhotos++
      if (e.mode === "strip") current.stripPhotos++
    }
    if (e.type === "discord_sent") current.discordSent++
  }

  return sessions.reverse()
}

/* ------------------------------ FORMATTERS ------------------------------ */

function parseIsoDate(iso) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function formatLongDate(iso) {
  return parseIsoDate(iso).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatShortDate(iso) {
  const d = parseIsoDate(iso)
  return `${DOW[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
}

function formatShortDateTime(ts) {
  const d = new Date(ts)
  return `${d.getDate()}/${d.getMonth() + 1} ${formatClock(ts)}`
}

function formatDuration(ms) {
  if (ms <= 0) return "-"
  const totalMin = Math.round(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m}m`
  return `${h}u ${m}m`
}
