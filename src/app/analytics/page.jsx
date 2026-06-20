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
import { Button } from "@/components/ui/Button"
import { SegmentedControl } from "@/components/ui/SegmentedControl"
import { Spinner } from "@/components/ui/Spinner"
import {
  StatCard,
  BarChart,
  BreakdownCard,
  discordSubtitle,
  formatLongDate,
  formatShortDate,
} from "@/components/drawers/analyticsParts"

const TABS = [
  { value: "overview", label: "Overzicht" },
  { value: "days", label: "Per dag" },
  { value: "events", label: "Events" },
  { value: "sessions", label: "Sessies" },
]

const CARD = "rounded-xl border border-hairline bg-surface"
const CARD_PAD = `${CARD} p-4`

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
    <div className="fixed inset-0 overflow-y-auto bg-ground text-ink">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-hairline bg-surface px-3 py-1.5 text-xs text-ink-muted transition-colors hover:bg-raised hover:text-ink"
            >
              ← Terug
            </Link>
            <div>
              <h1 className="font-display text-xl font-semibold md:text-2xl">Analytics</h1>
              <p className="text-xs text-ink-muted">Volledig lokaal overzicht van de photobooth</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              Importeer CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={downloadCsv}>
              Exporteer CSV
            </Button>
            <Button variant="danger" size="sm" onClick={handleClear}>
              Wissen
            </Button>
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
            className={`mb-4 text-xs ${importStatus.kind === "ok" ? "text-success" : "text-danger"}`}
          >
            {importStatus.message}
          </p>
        )}

        <SegmentedControl
          options={TABS}
          value={tab}
          onChange={setTab}
          ariaLabel="Analytics weergave"
          className="mb-6"
        />

        {!summary && (
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <Spinner className="h-4 w-4" />
            <span>Laden…</span>
          </div>
        )}
        {summary && summary.photoCount === 0 && events.length === 0 && (
          <p className="text-sm text-ink-muted">Nog geen data — neem wat foto&apos;s.</p>
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
        <StatCard
          size="lg"
          label="Foto's"
          value={summary.photoCount}
          sub={`${summary.singlePhotos} enkel · ${summary.stripPhotos} strip`}
        />
        <StatCard
          size="lg"
          label="Strips"
          value={summary.stripCount}
          sub={`${summary.sessions} sessies`}
        />
        <StatCard
          size="lg"
          label="Verzonden naar Discord"
          value={`${summary.discordSent}/${summary.discordSent + summary.discordFailed + summary.discordQueued}`}
          sub={discordSubtitle(summary)}
        />
        <StatCard
          size="lg"
          label="Trigger"
          value={`${summary.gestureCaptures}/${summary.gestureCaptures + summary.touchCaptures}`}
          sub={`gesture · rest (${summary.touchCaptures}) via touch`}
        />
        <StatCard
          size="lg"
          label="Top mascotte"
          value={topMascot?.[0] || "-"}
          sub={topMascot ? `${topMascot[1]} foto's` : undefined}
        />
        <StatCard
          size="lg"
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
        <p className="text-xs uppercase tracking-[0.16em] text-ink-dim">Activiteit per uur</p>
        <p className="text-[0.65rem] text-ink-dim">laatste {rows.length} dagen</p>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[32rem]">
          <div className="mb-1 grid grid-cols-[5rem_1fr_3rem] gap-2 text-[0.6rem] text-ink-dim">
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
            <div key={day.date} className="mb-px grid grid-cols-[5rem_1fr_3rem] items-center gap-2">
              <div className="truncate text-[0.65rem] text-ink-muted">
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
                          ? "rgba(245,241,232,0.06)"
                          : `rgba(230, 193, 137, ${0.2 + (c / max) * 0.8})`,
                    }}
                    title={`${day.date} ${h}:00 — ${c} foto's`}
                  />
                ))}
              </div>
              <span className="text-right text-xs font-medium tabular-nums text-ink">
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
    return <p className="text-sm text-ink-muted">Nog geen dagdata.</p>

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
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-raised"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">
            {formatLongDate(day.date)}
            {day.convention && (
              <span className="ml-2 text-xs font-medium text-gold">{day.convention.name}</span>
            )}
          </p>
          <p className="text-xs text-ink-muted">
            {day.photoCount} foto&apos;s · {day.sessions} sessies
            {dayStart &&
              dayEnd &&
              dayStart !== dayEnd &&
              ` · ${formatClock(dayStart)}–${formatClock(dayEnd)}`}
          </p>
        </div>
        <span className="text-lg leading-none text-ink-dim" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-hairline px-4 py-4">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <StatCard size="sm" label="Enkel" value={day.singlePhotos} />
            <StatCard
              size="sm"
              label="Strip"
              value={`${day.stripPhotos}`}
              sub={`${day.stripCount} compleet`}
            />
            <StatCard
              size="sm"
              label="Verzonden"
              value={`${day.discordSent}/${day.discordSent + day.discordFailed + day.discordQueued}`}
              sub={`${day.discordFailed} mislukt${day.discordQueued ? ` · ${day.discordQueued} wachtrij` : ""}`}
            />
            <StatCard
              size="sm"
              label="Trigger"
              value={`${day.gestureCaptures}/${day.photoCount}`}
              sub={`gesture · ${day.touchCaptures} touch`}
            />
            <StatCard
              size="sm"
              label="Start"
              value={dayStart ? formatClock(dayStart) : "-"}
              sub={
                firstPhoto && firstPhoto !== dayStart
                  ? `eerste foto ${formatClock(firstPhoto)}`
                  : undefined
              }
            />
            <StatCard
              size="sm"
              label="Einde"
              value={dayEnd ? formatClock(dayEnd) : "-"}
              sub={
                lastPhoto && lastPhoto !== dayEnd
                  ? `laatste foto ${formatClock(lastPhoto)}`
                  : undefined
              }
            />
            <StatCard
              size="sm"
              label="Piekuur"
              value={day.peakHour !== null ? `${day.peakHour}:00` : "-"}
            />
            <StatCard
              size="sm"
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
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-ink-dim">Uurverdeling</p>
      <BarChart
        data={data}
        size="lg"
        labels={["0:00", "6:00", "12:00", "18:00", "23:59"]}
        barTitle={(count, hour) => `${hour}:00 — ${count} foto's`}
      />
    </div>
  )
}

function TimeDots({ timestamps, dayIso }) {
  const dayStart = new Date(`${dayIso}T00:00:00`).getTime()
  const DAY_MS = 24 * 60 * 60 * 1000
  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-ink-dim">
        Fototijden ({timestamps.length})
      </p>
      <div className="relative h-6 rounded-md border border-hairline bg-surface">
        {timestamps.map((t, i) => {
          const pct = Math.max(0, Math.min(1, (t - dayStart) / DAY_MS)) * 100
          return (
            <div
              key={i}
              className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-gold"
              style={{ left: `${pct}%` }}
              title={formatClock(t)}
            />
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------ EVENTS ------------------------------ */

function EventsTab({ summary, events }) {
  if (summary.eventBreakdown.length === 0)
    return (
      <p className="text-sm text-ink-muted">
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
      <header className="flex items-center gap-4 border-b border-hairline bg-raised px-5 py-4">
        <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-surface">
          <Image
            src={convention.bannerPath}
            alt={convention.name}
            fill
            sizes="112px"
            className="object-contain p-1.5"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-ink">{convention.name}</h2>
          <p className="text-xs text-ink-muted">
            {formatLongDate(convention.startDate)} – {formatLongDate(convention.endDate)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-semibold text-ink">{event.photoCount}</p>
          <p className="text-[0.65rem] uppercase tracking-[0.16em] text-ink-dim">foto&apos;s</p>
        </div>
      </header>

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard size="sm" label="Enkel" value={event.singlePhotos} />
          <StatCard
            size="sm"
            label="Strip"
            value={event.stripPhotos}
            sub={`${event.stripCount} compleet`}
          />
          <StatCard
            size="sm"
            label="Verzonden"
            value={`${event.discordSent}/${event.discordSent + event.discordFailed}`}
            sub={`${event.discordFailed} mislukt`}
          />
          <StatCard
            size="sm"
            label="Trigger"
            value={`${event.gestureCaptures}/${event.photoCount}`}
            sub={`gesture · ${event.touchCaptures} touch`}
          />
          <StatCard size="sm" label="Sessies" value={event.sessions} />
          <StatCard size="sm" label="Dagen" value={days.length} />
          <StatCard
            size="sm"
            label="Top mascotte"
            value={topMascot?.[0] || "-"}
            sub={topMascot ? `${topMascot[1]}×` : undefined}
          />
          <StatCard
            size="sm"
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
  if (sessions.length === 0) return <p className="text-sm text-ink-muted">Nog geen sessies.</p>

  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="grid grid-cols-[7rem_5rem_5rem_1fr] gap-2 border-b border-hairline px-4 py-2 text-[0.65rem] uppercase tracking-[0.14em] text-ink-dim">
        <span>Start</span>
        <span>Duur</span>
        <span>Foto&apos;s</span>
        <span>Detail</span>
      </div>
      <ul>
        {sessions.map((s) => (
          <li
            key={s.start}
            className="grid grid-cols-[7rem_5rem_5rem_1fr] gap-2 border-b border-hairline px-4 py-2 text-sm last:border-b-0"
          >
            <span className="text-ink">{formatShortDateTime(s.start)}</span>
            <span className="text-ink-muted">{formatDuration(s.duration)}</span>
            <span className="text-ink">{s.photoCount}</span>
            <span className="text-xs text-ink-muted">
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