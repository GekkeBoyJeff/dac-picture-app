"use client"

import { useState, useEffect } from "react"
import { getSummary, downloadCsv, clearAnalytics } from "@/lib/storage/analytics"

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-white/50 text-xs">{label}</p>
      <p className="text-white text-xl font-semibold mt-0.5">{value}</p>
      {sub && <p className="text-white/40 text-xs mt-0.5">{sub}</p>}
    </div>
  )
}

export function AnalyticsDashboard() {
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    getSummary().then(setSummary)
  }, [])

  if (!summary) return null

  const topMascot = Object.entries(summary.mascotCounts).sort((a, b) => b[1] - a[1])[0]
  const topLayout = Object.entries(summary.layoutCounts).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-semibold">Analytics</p>
          <p className="text-white/50 text-xs">Lokale statistieken</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Foto's" value={summary.photoCount} />
        <Stat
          label="Discord"
          value={`${summary.discordSuccessRate}%`}
          sub={`${summary.discordSent} verzonden, ${summary.discordFailed} mislukt`}
        />
        <Stat
          label="Gesture"
          value={`${summary.gestureRatio}%`}
          sub={`${summary.gestureCaptures} gesture, ${summary.touchCaptures} touch`}
        />
        <Stat
          label="Populairst"
          value={topMascot?.[0] || "-"}
          sub={topLayout ? `Layout: ${topLayout[0]}` : undefined}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={downloadCsv}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white/70 text-xs hover:bg-white/10 transition-colors cursor-pointer"
        >
          CSV exporteren
        </button>
        <button
          onClick={async () => {
            await clearAnalytics()
            setSummary(await getSummary())
          }}
          className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-red-300/70 text-xs hover:bg-red-400/10 transition-colors cursor-pointer"
        >
          Wissen
        </button>
      </div>
    </div>
  )
}