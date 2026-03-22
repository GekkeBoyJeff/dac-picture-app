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

  if (config.fixedSize) {
    style.width = `${config.maxWidth}px`;
    style.height = `${config.maxHeight}px`;
  } else if (config.maxHeight > config.maxWidth * 1.5) {
    style.maxHeight = `${heightPerc}%`;
    style.width = "auto";
    style.maxWidth = `${widthPerc}%`;
  } else {
    style.width = `${widthPerc}%`;
    style.height = "auto";
  }

  const padX = config.fixedSize ? `${config.padding}px` : `${padPercX}%`;
  const padY = config.fixedSize ? `${config.padding}px` : `${padPercY}%`;

  if (config.position.includes("top")) {
    style.top = padY;
  }
  if (config.position.includes("bottom")) {
    style.bottom = padY;
  }
  if (config.position.includes("left")) {
    style.left = padX;
  }
  if (config.position.includes("right")) {
    style.right = padX;
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
