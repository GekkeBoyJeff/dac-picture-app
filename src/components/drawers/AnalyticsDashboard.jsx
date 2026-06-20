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
import { Button } from "@/components/ui/Button"
import { SegmentedControl } from "@/components/ui/SegmentedControl"
import { StatCard, BarChart, formatDutchDate } from "./analyticsParts"

function HourlyChart({ data, compact = false }) {
  if (compact) {
    return (
      <BarChart data={data} size="sm" barTitle={(count, hour) => `${hour}:00 — ${count} foto's`} />
    )
  }
  return (
    <div className="rounded-xl border border-hairline bg-surface px-4 py-3">
      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-ink-dim">Uurverdeling</p>
      <BarChart
        data={data}
        size="md"
        labels={["0:00", "12:00", "23:00"]}
        barTitle={(count, hour) => `${hour}:00 — ${count} foto's`}
      />
    </div>
  )
}

function DailyBarChart({ days }) {
  const series = useMemo(() => days.slice(0, 30).reverse(), [days])
  if (series.length === 0) return null
  return (
    <div className="rounded-xl border border-hairline bg-surface px-4 py-3">
      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-ink-dim">Foto&apos;s per dag</p>
      <BarChart
        data={series.map((d) => d.photoCount)}
        size="xl"
        minBarWidth="min-w-[0.25rem]"
        labels={[series[0]?.date, series[series.length - 1]?.date]}
        barTitle={(count, i) =>
          `${series[i].date} — ${count} foto's${series[i].convention ? ` · ${series[i].convention.name}` : ""}`
        }
      />
    </div>
  )
}

function DayCard({ day, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const successRate = (() => {
    const total = day.discordSent + day.discordFailed + day.discordQueued
    return total === 0 ? null : Math.round((day.discordSent / total) * 100)
  })()

  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left transition-colors hover:bg-raised"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">
            {formatDutchDate(day.date)}
            {day.convention && (
              <span className="ml-2 text-xs font-medium text-gold">{day.convention.name}</span>
            )}
          </p>
          <p className="text-xs text-ink-muted">
            {day.photoCount} foto&apos;s · {day.sessions} sessies
            {day.peakHour !== null && ` · piek ${day.peakHour}:00`}
          </p>
        </div>
        <span className="text-lg leading-none text-ink-dim" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-hairline px-4 pb-4">
          <div className="grid grid-cols-2 gap-2 pt-3">
            <StatCard label="Enkel" value={day.singlePhotos} />
            <StatCard label="Strip" value={day.stripPhotos} sub={`${day.stripCount} compleet`} />
            <StatCard
              label="Verzonden"
              value={`${day.discordSent}/${day.discordSent + day.discordFailed + day.discordQueued}`}
              sub={`${day.discordFailed} mislukt${day.discordQueued ? ` · ${day.discordQueued} wachtrij` : ""}`}
            />
            <StatCard
              label="Trigger"
              value={`${day.gestureCaptures}/${day.photoCount}`}
              sub={`gesture · ${day.touchCaptures} touch`}
            />
            <StatCard label="Top mascotte" value={day.topMascot || "-"} />
            <StatCard label="Top layout" value={day.topLayout || "-"} />
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
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
      <div className="flex items-center gap-3 border-b border-hairline px-4 py-3">
        <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-raised">
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
          <p className="truncate text-sm font-semibold text-ink">{convention.name}</p>
          <p className="text-xs text-ink-muted">
            {formatDutchDate(convention.startDate)} — {formatDutchDate(convention.endDate)} ·{" "}
            {days.length} {days.length === 1 ? "dag" : "dagen"}
          </p>
        </div>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label="Foto's"
            value={photoCount}
            sub={`${singlePhotos} enkel · ${stripPhotos} strip`}
          />
          <StatCard label="Strips" value={stripCount} sub={`${sessions} sessies`} />
          <StatCard
            label="Verzonden"
            value={`${discordSent}/${discordSent + discordFailed}`}
            sub={`${discordFailed} mislukt`}
          />
          <StatCard
            label="Trigger"
            value={`${gestureCaptures}/${photoCount}`}
            sub={`gesture · ${touchCaptures} touch`}
          />
          <StatCard label="Top mascotte" value={topMascot?.[0] || "-"} />
          <StatCard label="Top layout" value={topLayout?.[0] || "-"} />
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
  { value: "overview", label: "Overzicht" },
  { value: "daily", label: "Per dag" },
  { value: "events", label: "Events" },
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
          <p className="text-sm font-semibold text-ink">Analytics</p>
          <p className="text-xs text-ink-muted">
            Lokale statistieken
            {dayCount > 0 ? ` — ${dayCount} ${dayCount === 1 ? "dag" : "dagen"}` : ""}
          </p>
        </div>
        <Link
          href="/analytics"
          className="shrink-0 rounded-lg border border-hairline bg-surface px-3 py-1.5 text-xs text-ink-muted transition-colors hover:bg-raised hover:text-ink"
        >
          Volledig dashboard →
        </Link>
      </div>

      <SegmentedControl
        options={TABS}
        value={tab}
        onChange={setTab}
        ariaLabel="Analytics weergave"
      />

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Foto's"
              value={summary.photoCount}
              sub={`${summary.singlePhotos || 0} enkel, ${summary.stripPhotos || 0} strip`}
            />
            <StatCard
              label="Strips"
              value={summary.stripCount || 0}
              sub={
                summary.photosPerSession ? `~${summary.photosPerSession} foto/sessie` : undefined
              }
            />
            <StatCard
              label="Verzonden naar Discord"
              value={`${summary.discordSent}/${summary.discordSent + summary.discordFailed + summary.discordQueued}`}
              sub={
                summary.discordSent + summary.discordFailed + summary.discordQueued === 0
                  ? "nog niets verzonden"
                  : `${summary.discordFailed} mislukt${summary.discordQueued ? ` · ${summary.discordQueued} in wachtrij` : ""}`
              }
            />
            <StatCard
              label="Trigger"
              value={`${summary.gestureCaptures}/${summary.gestureCaptures + summary.touchCaptures}`}
              sub={`via gesture · rest (${summary.touchCaptures}) via touch`}
            />
            <StatCard
              label="Populairst"
              value={topMascot?.[0] || "-"}
              sub={topLayout ? `Layout: ${topLayout[0]}` : undefined}
            />
            <StatCard
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
            <p className="px-1 text-xs text-ink-muted">Nog geen dagdata beschikbaar.</p>
          )}
          {summary.dailyBreakdown.map((day, i) => (
            <DayCard key={day.date} day={day} defaultOpen={i === 0} />
          ))}
        </div>
      )}

      {tab === "events" && (
        <div className="space-y-3">
          {(summary.eventBreakdown || []).length === 0 && (
            <p className="px-1 text-xs text-ink-muted">
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
          className={`px-1 text-xs ${importStatus.kind === "ok" ? "text-success" : "text-danger"}`}
        >
          {importStatus.message}
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={downloadCsv} className="flex-1">
          CSV exporteren
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1"
        >
          CSV importeren
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={async () => {
            await clearAnalytics()
            setSummary(await getSummary())
          }}
        >
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
    </div>
  )
}