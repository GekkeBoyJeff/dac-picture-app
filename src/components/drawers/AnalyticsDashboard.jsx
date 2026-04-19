"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  getSummary,
  downloadCsv,
  clearAnalytics,
  subscribe,
  importCsv,
} from "@/lib/storage/analytics"

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="text-white/50 text-xs uppercase tracking-[0.16em]">{label}</p>
      <p className="mt-0.5 text-xl font-semibold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-white/45">{sub}</p>}
    </div>
  )
}

function HourlyChart({ data, compact = false }) {
  const max = Math.max(...data, 1)
  return (
    <div className={compact ? "" : "rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"}>
      {!compact && (
        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Uurverdeling</p>
      )}
      <div className={`flex items-end gap-px ${compact ? "h-8" : "h-12"}`}>
        {data.map((count, hour) => (
          <div
            key={hour}
            className="flex-1 rounded-t-sm bg-gradient-to-t from-sky-300/45 to-amber-200/80 transition-all"
            style={{
              height: `${(count / max) * 100}%`,
              opacity: count > 0 ? 0.4 + (count / max) * 0.6 : 0.08,
            }}
            title={`${hour}:00 — ${count} foto's`}
          />
        ))}
      </div>
      {!compact && (
        <div className="flex justify-between mt-1">
          <span className="text-white/25 text-[0.6rem]">0:00</span>
          <span className="text-white/25 text-[0.6rem]">12:00</span>
          <span className="text-white/25 text-[0.6rem]">23:00</span>
        </div>
      )}
    </div>
  )
}

function DailyBarChart({ days }) {
  const series = useMemo(() => days.slice(0, 30).reverse(), [days])
  const max = Math.max(...series.map((d) => d.photoCount), 1)
  if (series.length === 0) return null
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Foto&apos;s per dag</p>
      <div className="flex items-end gap-1 h-24">
        {series.map((d) => (
          <div
            key={d.date}
            className="flex-1 min-w-[0.25rem] rounded-t-sm bg-gradient-to-t from-sky-300/40 to-amber-200/80"
            style={{
              height: `${(d.photoCount / max) * 100}%`,
              opacity: d.photoCount > 0 ? 0.5 + (d.photoCount / max) * 0.5 : 0.1,
            }}
            title={`${d.date} — ${d.photoCount} foto's${d.convention ? ` · ${d.convention.name}` : ""}`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1 text-[0.6rem] text-white/25">
        <span>{series[0]?.date}</span>
        <span>{series[series.length - 1]?.date}</span>
      </div>
    </div>
  )
}

function formatDutchDate(iso) {
  const [y, m, day] = iso.split("-").map(Number)
  const d = new Date(y, m - 1, day)
  return d.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" })
}

function DayCard({ day, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const successRate = (() => {
    const total = day.discordSent + day.discordFailed + day.discordQueued
    return total === 0 ? null : Math.round((day.discordSent / total) * 100)
  })()

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
      >
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold truncate">
            {formatDutchDate(day.date)}
            {day.convention && (
              <span className="ml-2 text-amber-200/80 text-xs font-medium">
                {day.convention.name}
              </span>
            )}
          </p>
          <p className="text-white/45 text-xs">
            {day.photoCount} foto&apos;s · {day.sessions} sessies
            {day.peakHour !== null && ` · piek ${day.peakHour}:00`}
          </p>
        </div>
        <span className="text-white/40 text-lg leading-none" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5">
          <div className="grid grid-cols-2 gap-2 pt-3">
            <Stat label="Enkel" value={day.singlePhotos} />
            <Stat label="Strip" value={day.stripPhotos} sub={`${day.stripCount} compleet`} />
            <Stat
              label="Verzonden"
              value={`${day.discordSent}/${day.discordSent + day.discordFailed + day.discordQueued}`}
              sub={`${day.discordFailed} mislukt${day.discordQueued ? ` · ${day.discordQueued} wachtrij` : ""}`}
            />
            <Stat
              label="Trigger"
              value={`${day.gestureCaptures}/${day.photoCount}`}
              sub={`gesture · ${day.touchCaptures} touch`}
            />
            <Stat label="Top mascotte" value={day.topMascot || "-"} />
            <Stat label="Top layout" value={day.topLayout || "-"} />
          </div>
          {day.photoCount > 0 && <HourlyChart data={day.hourlyDistribution} />}
        </div>
      )}
    </div>
  )
}

function EventCard({ event }) {
  const {
    convention,
    days,
    photoCount,
    singlePhotos,
    stripPhotos,
    stripCount,
    discordSent,
    discordFailed,
    gestureCaptures,
    touchCaptures,
    sessions,
    mascotCounts,
    layoutCounts,
  } = event
  const topMascot = Object.entries(mascotCounts).sort((a, b) => b[1] - a[1])[0]
  const topLayout = Object.entries(layoutCounts).sort((a, b) => b[1] - a[1])[0]
  const successRate = (() => {
    const total = discordSent + discordFailed
    return total === 0 ? null : Math.round((discordSent / total) * 100)
  })()

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
        <div className="relative h-12 w-20 shrink-0 rounded-lg bg-white/5 overflow-hidden">
          <Image
            src={convention.bannerPath}
            alt={convention.name}
            fill
            sizes="80px"
            className="object-contain p-1"
            unoptimized
          />
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold truncate">{convention.name}</p>
          <p className="text-white/45 text-xs">
            {formatDutchDate(convention.startDate)} — {formatDutchDate(convention.endDate)} ·{" "}
            {days.length} {days.length === 1 ? "dag" : "dagen"}
          </p>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Stat
            label="Foto's"
            value={photoCount}
            sub={`${singlePhotos} enkel · ${stripPhotos} strip`}
          />
          <Stat label="Strips" value={stripCount} sub={`${sessions} sessies`} />
          <Stat
            label="Verzonden"
            value={`${discordSent}/${discordSent + discordFailed}`}
            sub={`${discordFailed} mislukt`}
          />
          <Stat
            label="Trigger"
            value={`${gestureCaptures}/${photoCount}`}
            sub={`gesture · ${touchCaptures} touch`}
          />
          <Stat label="Top mascotte" value={topMascot?.[0] || "-"} />
          <Stat label="Top layout" value={topLayout?.[0] || "-"} />
        </div>

        <div className="space-y-2">
          {days.map((d) => (
            <DayCard key={d.date} day={d} />
          ))}
        </div>
      </div>
    </div>
  )
}

const TABS = [
  { id: "overview", label: "Overzicht" },
  { id: "daily", label: "Per dag" },
  { id: "events", label: "Events" },
]

export function AnalyticsDashboard() {
  const [summary, setSummary] = useState(null)
  const [tab, setTab] = useState("overview")
  const [importStatus, setImportStatus] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    getSummary().then(setSummary)
    return subscribe(() => getSummary().then(setSummary))
  }, [])

  if (!summary) return null

  const topMascot = Object.entries(summary.mascotCounts).sort((a, b) => b[1] - a[1])[0]
  const topLayout = Object.entries(summary.layoutCounts).sort((a, b) => b[1] - a[1])[0]
  const dayCount = (summary.dailyBreakdown || []).length

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    try {
      const result = await importCsv(file)
      setImportStatus({
        kind: "ok",
        message: `Geïmporteerd: ${result.added} nieuw, ${result.skipped} overgeslagen`,
      })
    } catch (err) {
      setImportStatus({ kind: "err", message: `Import mislukt: ${err?.message || "onbekend"}` })
    }
    setTimeout(() => setImportStatus(null), 4000)
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white text-sm font-semibold">Analytics</p>
          <p className="text-white/50 text-xs">
            Lokale statistieken
            {dayCount > 0 ? ` — ${dayCount} ${dayCount === 1 ? "dag" : "dagen"}` : ""}
          </p>
        </div>
        <Link
          href="/analytics"
          className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/10"
        >
          Volledig dashboard →
        </Link>
      </div>

      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              tab === t.id ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="Foto's"
              value={summary.photoCount}
              sub={`${summary.singlePhotos || 0} enkel, ${summary.stripPhotos || 0} strip`}
            />
            <Stat
              label="Strips"
              value={summary.stripCount || 0}
              sub={
                summary.photosPerSession ? `~${summary.photosPerSession} foto/sessie` : undefined
              }
            />
            <Stat
              label="Verzonden naar Discord"
              value={`${summary.discordSent}/${summary.discordSent + summary.discordFailed + summary.discordQueued}`}
              sub={
                summary.discordSent + summary.discordFailed + summary.discordQueued === 0
                  ? "nog niets verzonden"
                  : `${summary.discordFailed} mislukt${summary.discordQueued ? ` · ${summary.discordQueued} in wachtrij` : ""}`
              }
            />
            <Stat
              label="Trigger"
              value={`${summary.gestureCaptures}/${summary.gestureCaptures + summary.touchCaptures}`}
              sub={`via gesture · rest (${summary.touchCaptures}) via touch`}
            />
            <Stat
              label="Populairst"
              value={topMascot?.[0] || "-"}
              sub={topLayout ? `Layout: ${topLayout[0]}` : undefined}
            />
            <Stat
              label="Piekuur"
              value={summary.photoCount > 0 ? `${summary.peakHour}:00` : "-"}
              sub={`${summary.sessions || 0} sessies`}
            />
          </div>

          {summary.photoCount > 0 && summary.hourlyDistribution && (
            <HourlyChart data={summary.hourlyDistribution} />
          )}
        </>
      )}

      {tab === "daily" && (
        <div className="space-y-2">
          {dayCount === 0 && (
            <p className="text-white/45 text-xs px-1">Nog geen dagdata beschikbaar.</p>
          )}
          {summary.dailyBreakdown.map((day, i) => (
            <DayCard key={day.date} day={day} defaultOpen={i === 0} />
          ))}
        </div>
      )}

      {tab === "events" && (
        <div className="space-y-3">
          {(summary.eventBreakdown || []).length === 0 && (
            <p className="text-white/45 text-xs px-1">
              Nog geen foto&apos;s tijdens een evenement. Tijdens een conventie verschijnt hier
              automatisch een aparte kaart.
            </p>
          )}
          {summary.eventBreakdown.map((event) => (
            <EventCard key={event.convention.slug} event={event} />
          ))}
        </div>
      )}

      {importStatus && (
        <p
          className={`text-xs px-1 ${
            importStatus.kind === "ok" ? "text-emerald-300/80" : "text-red-300/80"
          }`}
        >
          {importStatus.message}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={downloadCsv}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition-colors cursor-pointer hover:bg-white/10"
        >
          CSV exporteren
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition-colors cursor-pointer hover:bg-white/10"
        >
          CSV importeren
        </button>
        <button
          type="button"
          onClick={async () => {
            await clearAnalytics()
            setSummary(await getSummary())
          }}
          className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300/70 transition-colors cursor-pointer hover:bg-red-400/10"
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
    </div>
  )
}