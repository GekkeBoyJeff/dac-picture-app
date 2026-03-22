import type { OverlayConfig } from "./types";
import { VIDEO } from "./config";

export function getOverlayStyle(config: OverlayConfig): React.CSSProperties {
  if (config.position === "full") {
    return { position: "absolute", inset: 0, width: "100%", height: "100%" };
  }

  // In portrait the short side is width, so swap design dimensions to match
  const isPortrait = typeof window !== "undefined" && window.innerHeight > window.innerWidth;
  const designW = isPortrait ? VIDEO.DESIGN_HEIGHT : VIDEO.DESIGN_WIDTH;
  const designH = isPortrait ? VIDEO.DESIGN_WIDTH : VIDEO.DESIGN_HEIGHT;

  const padPercX = (config.padding / designW) * 100;
  const padPercY = (config.padding / designH) * 100;
  const widthPerc = (config.maxWidth / designW) * 100;
  const heightPerc = (config.maxHeight / designH) * 100;

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
