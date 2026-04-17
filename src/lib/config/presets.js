import { assetPath } from "./basePath"

// Each convention has a date range — the app shows the matching banner automatically.
export const CONVENTIONS = [
  {
    slug: "hmia-2026",
    name: "Heroes Made in Asia",
    startDate: "2026-03-19",
    endDate: "2026-03-21",
    bannerPath: assetPath("/overlays/conventions/hmia-2026/banner.png"),
    position: "bottom-left",
    opacity: 1,
    sizes: {
      sm: { maxWidth: 12, maxHeight: 8.5 },
      md: { maxWidth: 18, maxHeight: 13 },
      lg: { maxWidth: 24, maxHeight: 17 },
    },
  },
  {
    slug: "dcc-2026",
    name: "Dutch Comic Con",
    startDate: "2026-06-20",
    endDate: "2026-06-21",
    bannerPath: assetPath("/overlays/conventions/dcc-2026/banner.svg"),
    position: "bottom-left",
    opacity: 1,
    offset: { sm: { x: 2, y: 2 }, md: { x: 2, y: 2 }, lg: { x: 2, y: 2 } },
    sizes: {
      sm: { maxWidth: 12, maxHeight: 8.5 },
      md: { maxWidth: 18, maxHeight: 13 },
      lg: { maxWidth: 24, maxHeight: 17 },
    },
  },
  {
    slug: "animecon-2026",
    name: "AnimeCon",
    startDate: "2026-04-17",
    endDate: "2026-04-19",
    bannerPath: assetPath("/overlays/conventions/animecon-2026/banner.png"),
    position: "bottom-left",
    opacity: 1,
    offset: { sm: { x: 1, y: 1 }, md: { x: 1, y: 1 }, lg: { x: 1, y: 1 } },
    sizes: {
      sm: { maxWidth: 12, maxHeight: 8.5 },
      md: { maxWidth: 18, maxHeight: 13 },
      lg: { maxWidth: 24, maxHeight: 17 },
    },
  },
]

export function getActiveConvention() {
  const today = new Date().toISOString().slice(0, 10)
  return CONVENTIONS.find((c) => today >= c.startDate && today <= c.endDate) ?? null
}

// Mascot `defaults` apply unless overridden by a layout's `mascotOverrides`.
export const MASCOTS = [
  {
    id: "amelia",
    name: "Amelia",
    path: assetPath("/overlays/mascots/amelia.webp"),
    thumbnail: assetPath("/overlays/mascots/amelia.webp"),
    defaults: { sizingAxis: "height" },
  },
  {
    id: "amelia-v2",
    name: "Amelia v2",
    path: assetPath("/overlays/mascots/amelia-v2.webp"),
    thumbnail: assetPath("/overlays/mascots/amelia-v2.webp"),
    defaults: { sizingAxis: "height" },
  },
  {
    id: "amelia-beer",
    name: "Amelia (Beer)",
    path: assetPath("/overlays/mascots/amelia-beer.webp"),
    thumbnail: assetPath("/overlays/mascots/amelia-beer.webp"),
    defaults: { sizingAxis: "height" },
  },
  {
    id: "amelia-hug",
    name: "Amelia (Hug)",
    path: assetPath("/overlays/mascots/amelia-hug.webp"),
    thumbnail: assetPath("/overlays/mascots/amelia-hug.webp"),
    defaults: { sizingAxis: "width" },
  },
  {
    id: "amelia-smile",
    name: "Amelia (Smile)",
    path: assetPath("/overlays/mascots/amelia-smile.webp"),
    thumbnail: assetPath("/overlays/mascots/amelia-smile.webp"),
    defaults: { sizingAxis: "height" },
  },
  {
    id: "amelia-beer-alt",
    name: "Amelia (Beer Alt)",
    path: assetPath("/overlays/mascots/amelia-beer-alt.webp"),
    thumbnail: assetPath("/overlays/mascots/amelia-beer-alt.webp"),
    defaults: { sizingAxis: "height" },
  },
]

export const DEFAULT_MASCOT_ID = "amelia"

// Layout presets — positioning cascade: mascotOverrides[id] > mascot.defaults > layout.mascot
export const LAYOUTS = [
  {
    id: "classic",
    name: "Classic",
    description: "Standard DAC layout",
    inset: { sm: 0.5, md: 0.5, lg: 0.5 },
    logo: { position: "top-left", offset: { x: 1, y: 1 }, size: { sm: 4, md: 4, lg: 4.5 } },
    mascot: {
      position: "bottom-right",
      opacity: 0.85,
      sizingAxis: "height",
      offset: { x: 0, y: 0 },
      sizes: {
        sm: { maxWidth: 15, maxHeight: 25 },
        md: { maxWidth: 10, maxHeight: 22 },
        lg: { maxWidth: 15, maxHeight: 34 },
      },
    },
    mascotOverrides: {},
    convention: { position: "bottom-left", offset: { x: 0.25, y: 0.25 } },
    title: { fontSize: { sm: 1.25, md: 1.25, lg: 1.5 } },
    qr: { opacity: 0.8, position: "top-right", size: { sm: 5, md: 6.5, lg: 8 } },
    date: {
      fontSize: { sm: 0.85, md: 1, lg: 1.1 },
      bottomPercent: { sm: 1.2, md: 1.5, lg: 1.5 },
    },
    corners: { size: { sm: 4.5, md: 4.5, lg: 4.5 } },
  },
  {
    id: "flipped",
    name: "Flipped",
    description: "Classic layout mirrored",
    inset: { sm: 0.5, md: 0.5, lg: 0.5 },
    logo: { position: "top-right", offset: { x: 1, y: 1 }, size: { sm: 5, md: 4, lg: 4.5 } },
    mascot: {
      position: "bottom-left",
      opacity: 0.85,
      sizingAxis: "height",
      offset: { x: 0, y: 0 },
      sizes: {
        sm: { maxWidth: 5, maxHeight: 15 },
        md: { maxWidth: 10, maxHeight: 22 },
        lg: { maxWidth: 15, maxHeight: 26 },
      },
    },
    mascotOverrides: {},
    convention: { position: "bottom-right", offset: { x: 0.25, y: 0.25 } },
    title: { fontSize: { sm: 1.25, md: 1.25, lg: 1.5 } },
    qr: {
      opacity: 0.8,
      position: "top-left",
      offset: { x: 1, y: 1 },
      size: { sm: 5, md: 6.5, lg: 8 },
    },
    date: {
      fontSize: { sm: 0.85, md: 1, lg: 1.1 },
      bottomPercent: { sm: 1.2, md: 1.5, lg: 1.5 },
    },
    corners: { size: { sm: 4.5, md: 4.5, lg: 4.5 } },
  },
  {
    id: "hero",
    name: "Hero",
    description: "Mascot takes the stage",
    inset: { sm: 0.5, md: 0.5, lg: 0.5 },
    logo: { position: "top-left", offset: { x: 1, y: 1 }, size: { sm: 5, md: 4, lg: 4.5 } },
    mascot: {
      position: "bottom-right",
      opacity: 0.9,
      sizingAxis: "height",
      offset: {
        sm: { x: -5, y: 0 },
        "sm-landscape": { x: -2, y: 0 },
        md: { x: 0, y: 0 },
        "md-landscape": { x: -1, y: 0 },
        lg: { x: 0, y: 0 },
      },
      sizes: {
        sm: { maxWidth: 18, maxHeight: 48 },
        "sm-landscape": { maxWidth: 14, maxHeight: 22 },
        md: { maxWidth: 28, maxHeight: 48 },
        "md-landscape": { maxWidth: 20, maxHeight: 28 },
        lg: { maxWidth: 24, maxHeight: 54 },
      },
    },
    mascotOverrides: {},
    convention: { position: "bottom-left", offset: { x: 0.25, y: 0.25 } },
    title: { fontSize: { sm: 1.25, md: 1.25, lg: 1.5 } },
    qr: {
      opacity: 0.8,
      position: "top-right",
      offset: { x: 1, y: 1 },
      size: { sm: 5, md: 6.5, lg: 8 },
    },
    date: {
      fontSize: { sm: 0.85, md: 1, lg: 1.1 },
      bottomPercent: { sm: 1.2, md: 1.5, lg: 1.5 },
    },
    corners: { size: { sm: 4.5, md: 4.5, lg: 4.5 } },
  },
]

export const DEFAULT_LAYOUT_ID = "classic"