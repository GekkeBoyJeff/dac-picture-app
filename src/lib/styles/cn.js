/**
 * Tiny className joiner — filters out falsy values and joins with spaces.
 * Keeps component variant logic readable without pulling in clsx.
 */
export function cn(...parts) {
  return parts.filter(Boolean).join(" ")
}