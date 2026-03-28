const GESTURE_CONFIG = {
  Victory: { emoji: "\u270C\uFE0F", label: "Houd vast..." },
}

export function GestureIndicator({ gesture, holdProgress }) {
  if (!gesture) return null

  const { emoji, label } = GESTURE_CONFIG[gesture]
  const progress = holdProgress ?? 0

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20">
      <div className="relative w-9 h-9 flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18" cy="18" r="15"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="3"
          />
          <circle
            cx="18" cy="18" r="15"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${progress * 94.25} 94.25`}
            className="transition-[stroke-dasharray] duration-100"
          />
        </svg>
        <span className="text-xl">{emoji}</span>
      </div>
      <span className="text-white text-sm font-medium">{label}</span>
    </div>
  )
}