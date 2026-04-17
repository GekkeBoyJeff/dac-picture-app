const GOLD = "#e6c189"

export function SectionLabel({ title, description }) {
  return (
    <div className="space-y-1">
      <p className="text-[0.7rem] uppercase tracking-[0.24em] text-white/35 font-mono">{title}</p>
      <p className="text-xs leading-5 text-white/45">{description}</p>
    </div>
  )
}

export function ToggleRow({ title, description, active, disabled = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`relative flex min-h-[3rem] w-full items-center justify-between gap-4 overflow-hidden rounded-none border px-4 py-4 text-left transition-all duration-200 ${
        active
          ? "border-l-2 border-l-[#e6c189] border-y border-r border-white/10 bg-[#111]"
          : "border border-white/10 bg-[#111]"
      } ${disabled ? "opacity-55 cursor-not-allowed" : "cursor-pointer active:scale-[0.98]"}`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-white/40">{description}</p>
      </div>
      <span
        className={`shrink-0 rounded-none border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] font-mono ${
          active ? "border-[#e6c189] text-[#e6c189]" : "border-white/10 text-white/50 bg-black"
        }`}
      >
        {active ? "Aan" : "Uit"}
      </span>
    </button>
  )
}

export function StatPill({ label, value, tone = "default" }) {
  const isActive = tone === "active"
  return (
    <div
      className={`rounded-none border px-3 py-2 font-mono text-sm ${
        isActive ? "border-[#e6c189] bg-[#111]" : "border-white/10 bg-[#111]"
      }`}
    >
      <p
        className={`text-[0.65rem] uppercase tracking-[0.18em] ${isActive ? "text-white/60" : "text-white/40"}`}
      >
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
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
        <span className="font-mono text-white">{formatValue(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={disabled}
        className="w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ accentColor: GOLD }}
      />
    </div>
  )
}
