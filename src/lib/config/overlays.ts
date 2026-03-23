// Asset paths only — all sizing and positioning lives in the layout presets.
// This file is the single place to change file paths if assets move.

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const CORNERS = [
  { src: `${BASE_PATH}/overlays/corner-tl.svg`, position: "top-left" as const },
  { src: `${BASE_PATH}/overlays/corner-tr.svg`, position: "top-right" as const },
  { src: `${BASE_PATH}/overlays/corner-bl.svg`, position: "bottom-left" as const },
  { src: `${BASE_PATH}/overlays/corner-br.svg`, position: "bottom-right" as const },
];

export const LOGO = {
  src: `${BASE_PATH}/overlays/logo.png`,
} as const;

export const QR_CODE = {
  src: `${BASE_PATH}/overlays/qr-discord.svg`,
} as const;
