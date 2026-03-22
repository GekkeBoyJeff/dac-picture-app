import type { OverlayConfig } from "./types";

export function getOverlayClassName(config: OverlayConfig): string {
  const classes = ["pointer-events-none"];
  if (config.invert) {
    classes.push("brightness-0", "invert");
  }
  return classes.join(" ");
}
