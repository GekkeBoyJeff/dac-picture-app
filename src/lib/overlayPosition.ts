export type Breakpoint = "sm" | "md" | "lg";

/**
 * Breakpoint based on the shortest screen dimension.
 * A phone in landscape (short side ~390px) still gets "sm".
 * A tablet (short side ~768px) gets "md". Desktop ≥1024 → "lg".
 */
export function getBreakpoint(): Breakpoint {
  if (typeof document === "undefined") return "lg";
  const w = document.documentElement.clientWidth;
  const h = document.documentElement.clientHeight;
  const minDim = Math.min(w, h);
  if (minDim >= 1024) return "lg";
  if (minDim >= 600) return "md";
  return "sm";
}
