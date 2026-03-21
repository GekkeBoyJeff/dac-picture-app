import type { OverlayConfig, TextOverlayConfig } from "./types";

export const VIDEO = {
  IDEAL_WIDTH: 1920,
  IDEAL_HEIGHT: 1080,
  DESIGN_WIDTH: 1920,
  DESIGN_HEIGHT: 1080,
} as const;

export const IMAGE = {
  EXPORT_QUALITY: 1.0,
  GALLERY_QUALITY: 0.8,
  FORMAT: "image/jpeg" as const,
} as const;

export const GALLERY = {
  MAX_PHOTOS: 20,
  STORAGE_KEY: "photobooth-gallery",
} as const;

export const COUNTDOWN_SECONDS = 3;
export const TOAST_DURATION_MS = 1500;

export const OVERLAYS: OverlayConfig[] = [
  {
    path: "/overlays/frame.svg",
    position: "full",
    maxWidth: 1920,
    maxHeight: 1080,
    opacity: 1,
    padding: 0,
  },
  {
    path: "/overlays/logo.png",
    position: "top-left",
    maxWidth: 60,
    maxHeight: 60,
    opacity: 1,
    padding: 30,
    invert: true,
  },
  {
    path: "/overlays/DAC_Amelia.png",
    position: "bottom-right",
    maxWidth: 300,
    maxHeight: 480,
    opacity: 0.85,
    padding: 35,
  },
  {
    path: "/overlays/HMIA.png",
    position: "bottom-left",
    maxWidth: 280,
    maxHeight: 200,
    opacity: 1,
    padding: 35,
  },
];

export function getTextOverlays(): TextOverlayConfig[] {
  const today = new Date().toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return [
    {
      text: "DUTCH ANIME",
      x: 100,
      y: 48,
      fontSize: 24,
      color: "rgba(255,255,255,0.9)",
      opacity: 1,
      font: "600 'Arial', sans-serif",
      letterSpacing: 4,
    },
    {
      text: "COMMUNITY",
      x: 100,
      y: 74,
      fontSize: 24,
      color: "rgba(255,255,255,0.9)",
      opacity: 1,
      font: "600 'Arial', sans-serif",
      letterSpacing: 4,
    },
    {
      text: today,
      x: 330,
      y: 1080 - 45,
      fontSize: 14,
      color: "rgba(255,255,255,0.5)",
      opacity: 1,
      font: "'Courier New', monospace",
    },
  ];
}

export const DISCORD_MESSAGE = "📸 Nieuwe foto uit de photobooth!";
