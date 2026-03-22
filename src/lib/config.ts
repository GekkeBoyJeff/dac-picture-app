import type { OverlayConfig } from "./types";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

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

export const CORNERS = [
  { src: `${BASE_PATH}/overlays/corner-tl.svg`, position: "top-left" as const },
  { src: `${BASE_PATH}/overlays/corner-tr.svg`, position: "top-right" as const },
  { src: `${BASE_PATH}/overlays/corner-bl.svg`, position: "bottom-left" as const },
  { src: `${BASE_PATH}/overlays/corner-br.svg`, position: "bottom-right" as const },
];
export const CORNER_SIZE = 72;
export const CORNER_OFFSET = 8;

export const OVERLAYS: OverlayConfig[] = [
  {
    path: `${BASE_PATH}/overlays/logo.png`,
    position: "top-left",
    maxWidth: 60,
    maxHeight: 60,
    opacity: 1,
    padding: 30,
    invert: true,
    fixedSize: true,
  },
  {
    path: `${BASE_PATH}/overlays/DAC_Amelia.png`,
    position: "bottom-right",
    maxWidth: 300,
    maxHeight: 480,
    opacity: 0.85,
    padding: 35,
  },
  {
    path: `${BASE_PATH}/overlays/HMIA.png`,
    position: "bottom-left",
    maxWidth: 280,
    maxHeight: 200,
    opacity: 1,
    padding: 35,
  },
];

export const DISCORD_MESSAGE = "📸 Nieuwe foto uit de photobooth!";
