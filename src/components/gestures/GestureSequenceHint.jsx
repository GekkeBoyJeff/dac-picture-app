const STEP_ICONS = {
  Open_Palm: "\u{1F44B}",
  Closed_Fist: "\u270A",
}

// Intentionally reads refs during render — these refs are updated at 60fps by
// the gesture detection loop and this component re-renders on parent state changes.

export function GestureSequenceHint({ isActive, currentStep, sequence }) {
  if (!sequence) return null

  // Show the full sequence from the very first step so the first gesture is visible.
  if (!isActive) return null

  return (
    <div className="absolute top-32 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 px-5 py-3 rounded-2xl bg-surface/90 backdrop-blur-md border border-hairline-strong animate-fade-in">
      <div className="flex items-center gap-3">
        {sequence.map((step, idx) => {
          const done = idx < currentStep
          const active = idx === currentStep
          const icon = STEP_ICONS[step] || "?"
          return (
            <div
              key={idx}
              className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${
                done
                  ? "bg-success/20 border border-success/45"
                  : active
                    ? "bg-gold/20 border border-gold/55 shadow-[0_0_16px_rgba(230,193,137,0.35)]"
                    : "bg-raised border border-hairline"
              }`}
            >
              {done ? (
                <span className="text-success text-lg">{"\u2713"}</span>
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