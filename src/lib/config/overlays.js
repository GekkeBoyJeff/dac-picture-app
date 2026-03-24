// Asset paths only — all sizing and positioning lives in the layout presets.
// This file is the single place to change file paths if assets move.

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const CORNERS = [
  { src: `${BASE_PATH}/overlays/corner-tl.svg`, position: "top-left" },
  { src: `${BASE_PATH}/overlays/corner-tr.svg`, position: "top-right" },
  { src: `${BASE_PATH}/overlays/corner-bl.svg`, position: "bottom-left" },
  { src: `${BASE_PATH}/overlays/corner-br.svg`, position: "bottom-right" },
];

export const LOGO = {
  src: `${BASE_PATH}/overlays/logo.svg`,
};

export const QR_CODE = {
  src: `${BASE_PATH}/overlays/qr-discord.svg`,
};
