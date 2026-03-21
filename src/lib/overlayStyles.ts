import type { OverlayConfig } from "./types";
import { VIDEO } from "./config";

export function getOverlayStyle(config: OverlayConfig): React.CSSProperties {
  if (config.position === "full") {
    return { position: "absolute", inset: 0, width: "100%", height: "100%" };
  }

  const padPercX = (config.padding / VIDEO.DESIGN_WIDTH) * 100;
  const padPercY = (config.padding / VIDEO.DESIGN_HEIGHT) * 100;
  const widthPerc = (config.maxWidth / VIDEO.DESIGN_WIDTH) * 100;
  const heightPerc = (config.maxHeight / VIDEO.DESIGN_HEIGHT) * 100;

  const style: React.CSSProperties = {
    position: "absolute",
    opacity: config.opacity,
    pointerEvents: "none",
  };

  const isPortrait = config.maxHeight > config.maxWidth * 1.5;
  if (isPortrait) {
    style.height = `${heightPerc}%`;
    style.width = "auto";
    style.maxWidth = `${widthPerc}%`;
  } else {
    style.width = `${widthPerc}%`;
    style.height = "auto";
  }

  if (config.position.includes("top")) {
    style.top = `${padPercY}%`;
  }
  if (config.position.includes("bottom")) {
    style.bottom = `${padPercY}%`;
  }
  if (config.position.includes("left")) {
    style.left = `${padPercX}%`;
  }
  if (config.position.includes("right")) {
    style.right = `${padPercX}%`;
  }
  if (config.position === "middle-right") {
    style.right = `${padPercX}%`;
    style.top = "50%";
    style.transform = "translateY(-50%)";
  }

  return style;
}

export function getOverlayClassName(config: OverlayConfig): string {
  const classes = ["pointer-events-none"];
  if (config.invert) {
    classes.push("brightness-0", "invert");
  }
  return classes.join(" ");
}
