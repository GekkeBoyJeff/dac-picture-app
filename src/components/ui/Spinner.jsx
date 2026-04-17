export function Spinner({ className = "w-5 h-5" }) {
  return (
    <div
      className={`rounded-none border-2 border-white/20 border-t-[#e6c189] animate-spin ${className}`}
    />
  )
}
