const STEP_ICONS = {
  Open_Palm: "\u{1F44B}",
  Closed_Fist: "\u270A",
}

// Intentionally reads refs during render — these refs are updated at 60fps by
// the gesture detection loop and this component re-renders on parent state changes.

export function GestureSequenceHint({ isActive, currentStep, sequence }) {
  if (!sequence) return null

  // Only show after the first pair (palm+fist) is done — i.e. from step 2 onward
  if (!isActive || currentStep < 2) return null

  const remaining = sequence.slice(2)
  const adjustedStep = currentStep - 2

  return (
    <div className="absolute top-32 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 px-5 py-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 animate-fade-in">
      <div className="flex items-center gap-3">
        {remaining.map((step, idx) => {
          const done = idx < adjustedStep
          const active = idx === adjustedStep
          const icon = STEP_ICONS[step] || "?"
          return (
            <div
              key={idx}
              className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${
                done
                  ? "bg-green-500/30 border border-green-400/50"
                  : active
                    ? "bg-white/20 border border-white/40 animate-pulse"
                    : "bg-white/5 border border-white/10"
              }`}
            >
              {done ? (
                <span className="text-green-300 text-lg">{"\u2713"}</span>
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