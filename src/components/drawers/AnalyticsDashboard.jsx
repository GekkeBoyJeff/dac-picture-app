"use client"

import { useState, useEffect } from "react"
import { getSummary, downloadCsv, clearAnalytics, subscribe } from "@/lib/storage/analytics"

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="text-white/50 text-xs uppercase tracking-[0.16em]">{label}</p>
      <p className="mt-0.5 text-xl font-semibold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-white/45">{sub}</p>}
    </div>
  )
}

function HourlyChart({ data }) {
  const max = Math.max(...data, 1)
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-white/50">Uurverdeling</p>
      <div className="flex items-end gap-px h-12">
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
      <div className="flex justify-between mt-1">
        <span className="text-white/25 text-[0.6rem]">0:00</span>
        <span className="text-white/25 text-[0.6rem]">12:00</span>
        <span className="text-white/25 text-[0.6rem]">23:00</span>
      </div>
    </div>
  )
}

export function AnalyticsDashboard() {
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    getSummary().then(setSummary)
    return subscribe(() => getSummary().then(setSummary))
  }, [])

  if (!summary) return null

  const topMascot = Object.entries(summary.mascotCounts).sort((a, b) => b[1] - a[1])[0]
  const topLayout = Object.entries(summary.layoutCounts).sort((a, b) => b[1] - a[1])[0]
  const dayCount = Object.keys(summary.dailyCounts || {}).length

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-semibold">Analytics</p>
          <p className="text-white/50 text-xs">Lokale statistieken{dayCount > 0 ? ` — ${dayCount} ${dayCount === 1 ? "dag" : "dagen"}` : ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Foto's"
          value={summary.photoCount}
          sub={`${summary.singlePhotos || 0} enkel, ${summary.stripPhotos || 0} strip`}
        />
        <Stat
          label="Strips"
          value={summary.stripCount || 0}
          sub={summary.photosPerSession ? `~${summary.photosPerSession} foto/sessie` : undefined}
        />
        <Stat
          label="Discord"
          value={`${summary.discordSuccessRate}%`}
          sub={`${summary.discordSent} ok, ${summary.discordQueued || 0} wachtrij, ${summary.discordFailed} mislukt`}
        />
        <Stat
          label="Trigger"
          value={`${summary.gestureRatio}% gesture`}
          sub={`${summary.gestureCaptures} gesture, ${summary.touchCaptures} touch`}
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

      <div className="flex gap-2">
        <button
          onClick={downloadCsv}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition-colors cursor-pointer hover:bg-white/10"
        >
          CSV exporteren
        </button>
        <button
          onClick={async () => {
            await clearAnalytics()
            setSummary(await getSummary())
          }}
          className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300/70 transition-colors cursor-pointer hover:bg-red-400/10"
        >
          Wissen
        </button>
      </div>
    </div>
  )
}