const STEP_ICONS = {
  Open_Palm: "\u{1F44B}",
  Closed_Fist: "\u270A",
}

/**
 * Shows sequence step icons (palm / fist emojis) with done/active/pending states.
 *
 * Intentionally reads refs during render — these refs are updated at 60 fps
 * by the gesture detection loop and this component re-renders on parent state
 * changes.
 */
export function GestureSequenceHint({ isActive, currentStep, sequence }) {
  if (!sequence) return null

  // Only show after the first pair (palm + fist) is done — i.e. from step 2 onward
  if (!isActive || currentStep < 2) return null

  const remaining = sequence.slice(2)
  const adjustedStep = currentStep - 2

  return (
    <div className="absolute top-32 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 px-5 py-3 rounded-none bg-black border border-white/20 animate-fade-in">
      <div className="flex items-center gap-3">
        {remaining.map((step, idx) => {
          const done = idx < adjustedStep
          const active = idx === adjustedStep
          const icon = STEP_ICONS[step] || "?"
          return (
            <div
              key={idx}
              className={`relative w-10 h-10 flex items-center justify-center rounded-none transition-all duration-200 ${
                done
                  ? "bg-[#1a1a1a] border border-[#e6c189]"
                  : active
                    ? "bg-black border border-[#e6c189] animate-pulse"
                    : "bg-[#111] border border-white/10"
              }`}
            >
              {done ? (
                <span className="text-[#e6c189] text-lg font-mono">{"\u2713"}</span>
              ) : (
                <span className={`text-lg ${active ? "opacity-100" : "opacity-40"}`}>{icon}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
