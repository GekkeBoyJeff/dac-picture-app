import { cn } from "@/lib/styles/cn"

/* ============================================================
   Shared presentational pieces for the analytics surfaces.
   Both the in-drawer dashboard and the full /analytics page
   render these so the token language stays identical and the
   near-duplicate Stat/Chart/Breakdown markup lives in one spot.
   Pure presentation — no stores, no side effects.
   ============================================================ */

const STAT_SIZES = {
  sm: {
    wrap: "rounded-lg border border-hairline bg-surface px-3 py-2",
    label: "text-[0.6rem] uppercase tracking-[0.14em] text-ink-dim",
    value: "mt-0.5 text-base font-semibold text-ink font-display",
    sub: "text-[0.65rem] text-ink-muted",
  },
  md: {
    wrap: "rounded-xl border border-hairline bg-surface px-4 py-3",
    label: "text-xs uppercase tracking-[0.16em] text-ink-dim",
    value: "mt-0.5 text-xl font-semibold text-ink font-display",
    sub: "mt-0.5 text-xs text-ink-muted",
  },
  lg: {
    wrap: "rounded-xl border border-hairline bg-surface px-4 py-3",
    label: "text-[0.65rem] uppercase tracking-[0.16em] text-ink-dim",
    value: "mt-1 text-2xl font-semibold text-ink font-display",
    sub: "mt-0.5 text-xs text-ink-muted",
  },
}

/**
 * Labeled value card. `size` covers the old Stat (md), BigStat (lg)
 * and MiniStat (sm) variants without separate components.
 */
export function StatCard({ label, value, sub, size = "md", className = "" }) {
  const s = STAT_SIZES[size] || STAT_SIZES.md
  return (
    <div className={cn(s.wrap, className)}>
      <p className={s.label}>{label}</p>
      <p className={s.value}>{value}</p>
      {sub && <p className={s.sub}>{sub}</p>}
    </div>
  )
}

const BAR_HEIGHTS = { sm: "h-8", md: "h-12", lg: "h-16", xl: "h-24" }

/**
 * Vertical bar chart over a numeric series. Gold is the single data
 * colour; empty bars fade to a hairline ghost. `labels` renders the
 * axis row beneath; pass `barTitle(value, index)` for tooltips.
 */
export function BarChart({
  data,
  size = "md",
  className = "",
  labels = null,
  barTitle,
  minBarWidth = "",
}) {
  const max = Math.max(...data, 1)
  return (
    <div className={className}>
      <div className={cn("flex items-end gap-px", BAR_HEIGHTS[size] || BAR_HEIGHTS.md)}>
        {data.map((count, i) => (
          <div
            key={i}
            className={cn("flex-1 rounded-t-sm bg-gold transition-all", minBarWidth)}
            style={{
              height: `${(count / max) * 100}%`,
              opacity: count > 0 ? 0.45 + (count / max) * 0.55 : 0.1,
            }}
            title={barTitle ? barTitle(count, i) : undefined}
          />
        ))}
      </div>
      {labels && (
        <div className="mt-1 flex justify-between text-[0.6rem] text-ink-dim">
          {labels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Ranked "share of total" list with thin gold meters.
 * Used for mascotte/layout breakdowns on the full page.
 */
export function BreakdownCard({ title, counts, total }) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-hairline bg-surface p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-dim">{title}</p>
        <p className="mt-2 text-sm text-ink-muted">Geen data</p>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-hairline bg-surface p-4">
      <p className="mb-3 text-xs uppercase tracking-[0.16em] text-ink-dim">{title}</p>
      <ul className="space-y-2">
        {entries.map(([id, count]) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <li key={id}>
              <div className="flex items-center justify-between text-sm">
                <span className="truncate text-ink">{id}</span>
                <span className="text-xs text-ink-muted">
                  {count} · {pct}%
                </span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-raised">
                <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ------------------------------ DATE/COPY HELPERS ------------------------------ */

export function parseIsoDate(iso) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/** "ma 3 mrt" — compact weekday for cards. */
export function formatDutchDate(iso) {
  return parseIsoDate(iso).toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

/** "maandag 3 maart 2025" — full date for page headers. */
export function formatLongDate(iso) {
  return parseIsoDate(iso).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

const DOW = ["zo", "ma", "di", "wo", "do", "vr", "za"]

/** "ma 3/3" — heatmap row labels. */
export function formatShortDate(iso) {
  const d = parseIsoDate(iso)
  return `${DOW[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
}

/** Discord delivery subtitle: failures + queued, or an empty-state note. */
export function discordSubtitle(s) {
  const total = s.discordSent + s.discordFailed + s.discordQueued
  if (total === 0) return "nog niets verzonden"
  const parts = [`${s.discordFailed} mislukt`]
  if (s.discordQueued > 0) parts.unshift(`${s.discordQueued} in wachtrij`)
  return parts.join(" · ")
}