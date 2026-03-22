import type { OverlayConfig } from "../types";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const CORNERS = [
  { src: `${BASE_PATH}/overlays/corner-tl.svg`, position: "top-left" as const },
  { src: `${BASE_PATH}/overlays/corner-tr.svg`, position: "top-right" as const },
  { src: `${BASE_PATH}/overlays/corner-bl.svg`, position: "bottom-left" as const },
  { src: `${BASE_PATH}/overlays/corner-br.svg`, position: "bottom-right" as const },
];

/** All values in rem */
export const CORNER_SIZES = {
  sm: { size: 2, offset: 0.25 },
  md: { size: 3.75, offset: 0.5 },
  lg: { size: 4.5, offset: 0.5 },
} as const;

export const QR_CODE = {
  src: `${BASE_PATH}/overlays/qr-discord.svg`,
  opacity: 0.85,
  /** All values in rem */
  sizes: {
    sm: { size: 4.5, top: 4, left: 0.5 },
    md: { size: 6.5, top: 5, left: 1 },
    lg: { size: 8, top: 6, left: 1.25 },
  },
} as const;

/** All size values in rem */
export const OVERLAYS: OverlayConfig[] = [
  {
    path: `${BASE_PATH}/overlays/logo.png`,
    position: "top-left",
    opacity: 1,
    invert: true,
    fixedSize: true,
    sizes: {
      sm: { maxWidth: 2.75, maxHeight: 2.75, padding: 0.75 },
      md: { maxWidth: 3.25, maxHeight: 3.25, padding: 1.75 },
      lg: { maxWidth: 3.75, maxHeight: 3.75, padding: 1.875 },
    },
  },
  {
    path: `${BASE_PATH}/overlays/DAC_Amelia.png`,
    position: "bottom-right",
    opacity: 0.85,
    sizes: {
      sm: { maxWidth: 10, maxHeight: 15, padding: 0 },
      md: { maxWidth: 15, maxHeight: 22, padding: 1 },
      lg: { maxWidth: 19, maxHeight: 26, padding: 1.25 },
    },
  },
  {
    path: `${BASE_PATH}/overlays/HMIA.png`,
    position: "bottom-left",
    opacity: 1,
    sizes: {
      sm: { maxWidth: 12, maxHeight: 8.5, padding: 0.5 },
      md: { maxWidth: 18, maxHeight: 13, padding: 1 },
      lg: { maxWidth: 24, maxHeight: 17, padding: 1.25 },
    },
  },
];

/** Title text — all values in rem */
export const TITLE_SIZES = {
  sm: { top: 0.75, left: 4, fontSize: 0.625 },
  md: { top: 1.625, left: 5.75, fontSize: 1.125 },
  lg: { top: 1.875, left: 6.25, fontSize: 1.5 },
} as const;

/** Date stamp — fontSize in rem, bottom in % */
export const DATE_STAMP = {
  sm: { bottomPercent: 1.2, fontSize: 0.5 },
  md: { bottomPercent: 1.5, fontSize: 0.6875 },
  lg: { bottomPercent: 1.5, fontSize: 0.875 },
} as const;
