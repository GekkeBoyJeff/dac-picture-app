export function Spinner({ className = "w-5 h-5" }) {
  return (
    <div
      className={`rounded-full border-2 border-white/10 border-t-white/50 animate-spin ${className}`}
    />
  );
}
