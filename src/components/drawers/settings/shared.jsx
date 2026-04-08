import {
  drawerButtonBaseClass,
  drawerSectionHelpClass,
  drawerSectionLabelClass,
} from "@/components/ui/drawerStyles"

const CARD_RADIUS = "rounded-xl"
const drawerCard = `${CARD_RADIUS} border border-white/10 bg-white/[0.04] shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]`
const rowBase = `w-full ${CARD_RADIUS} border px-4 py-4 text-left ${drawerButtonBaseClass}`

export function SectionLabel({ title, description }) {
  return (
    <div className="space-y-1">
      <p className={drawerSectionLabelClass}>{title}</p>
      <p className={drawerSectionHelpClass}>{description}</p>
    </div>
  )
}

export function ToggleRow({
  title,
  description,
  active,
  disabled = false,
  onClick,
  activeTone = "sky",
}) {
  const activeStyles = {
    amber:
      "border-amber-400/45 bg-amber-400/10 text-white shadow-[0_0_0_1px_rgba(245,158,11,0.18)]",
    sky: "border-sky-400/45 bg-sky-400/10 text-white shadow-[0_0_0_1px_rgba(56,189,248,0.18)]",
    emerald:
      "border-emerald-400/45 bg-emerald-400/10 text-white shadow-[0_0_0_1px_rgba(16,185,129,0.16)]",
    violet:
      "border-violet-400/45 bg-violet-400/10 text-white shadow-[0_0_0_1px_rgba(167,139,250,0.16)]",
  }
  const inactiveStyles =
    "border-white/10 bg-white/5 text-white/75 hover:border-white/20 hover:bg-white/[0.07]"
  const dotStyles = {
    amber: active ? "bg-amber-300 shadow-[0_0_0_4px_rgba(251,191,36,0.12)]" : "bg-white/20",
    sky: active ? "bg-sky-300 shadow-[0_0_0_4px_rgba(56,189,248,0.12)]" : "bg-white/20",
    emerald: active ? "bg-emerald-300 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" : "bg-white/20",
    violet: active ? "bg-violet-300 shadow-[0_0_0_4px_rgba(167,139,250,0.12)]" : "bg-white/20",
  }
  const statusStyles = {
    amber: active
      ? "border-amber-300/40 bg-amber-300/15 text-amber-50"
      : "border-white/10 bg-white/5 text-white/50",
    sky: active
      ? "border-sky-300/40 bg-sky-300/15 text-sky-50"
      : "border-white/10 bg-white/5 text-white/50",
    emerald: active
      ? "border-emerald-300/40 bg-emerald-300/15 text-emerald-50"
      : "border-white/10 bg-white/5 text-white/50",
    violet: active
      ? "border-violet-300/40 bg-violet-300/15 text-violet-50"
      : "border-white/10 bg-white/5 text-white/50",
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`${rowBase} relative min-h-[4.8rem] flex items-center justify-between gap-4 overflow-hidden ${drawerCard} ${disabled ? "opacity-55 cursor-not-allowed" : "cursor-pointer"} ${active ? activeStyles[activeTone] : inactiveStyles}`}
    >
      <span className={`relative h-2.5 w-2.5 shrink-0 rounded-full ${dotStyles[activeTone]}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-white/55">{description}</p>
      </div>
      <span
        className={`shrink-0 rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] ${statusStyles[activeTone]}`}
      >
        {active ? "Aan" : "Uit"}
      </span>
    </button>
  )
}

export function StatPill({ label, value, tone = "white" }) {
  const tones = {
    default: "border-white/10 bg-white/5 text-white/80",
    sky: "border-sky-400/35 bg-sky-400/10 text-sky-50 shadow-[0_0_0_1px_rgba(56,189,248,0.08)]",
  }
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${tones[tone]}`}>
      <p
        className={`text-[0.65rem] uppercase tracking-[0.18em] ${tone === "default" ? "text-white/45" : "text-white/60"}`}
      >
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-semibold ${tone === "default" ? "text-white" : "text-white"}`}
      >
        {value}
      </p>
    </div>
  )
}

export function RangeControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue = (v) => v,
  disabled = false,
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-white/60">
        <span>{label}</span>
        <span className="font-mono text-white/80">{formatValue(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={disabled}
        className="w-full cursor-pointer accent-sky-400 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  )
}
