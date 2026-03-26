const GESTURE_CONFIG = {
  Victory: { emoji: "\u270C\uFE0F", label: "Houd vast..." },
}

export function GestureIndicator({ gesture }) {
  if (!gesture) return null

  const { emoji, label } = GESTURE_CONFIG[gesture]

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 animate-pulse">
      <span className="text-2xl">{emoji}</span>
      <span className="text-white text-sm font-medium">{label}</span>
    </div>
  )
}