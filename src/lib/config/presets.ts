import type { OverlaySize, OverlayPosition } from "../types";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

// --- Conventions ---

export interface Convention {
    slug: string;
    name: string;
    startDate: string;
    endDate: string;
    bannerPath: string;
    position: OverlayPosition;
    opacity: number;
    sizes: Bp<OverlaySize>;
    padding?: Bp<number>;
}

export const CONVENTIONS: Convention[] = [
    {
        slug: "hmia-2026",
        name: "Heroes Made in Asia",
        startDate: "2026-03-19",
        endDate: "2026-03-22",
        bannerPath: `${BASE_PATH}/overlays/conventions/hmia-2026/banner.png`,
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
        startDate: "2026-02-20",
        endDate: "2026-06-21",
        bannerPath: `${BASE_PATH}/overlays/conventions/dcc-2026/banner.svg`,
        position: "bottom-left",
        opacity: 1,
        padding: { sm: 2, md: 2, lg: 2 },
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
        bannerPath: `${BASE_PATH}/overlays/conventions/animecon-2026/banner.png`,
        position: "bottom-left",
        opacity: 1,
        padding: { sm: 1, md: 1, lg: 1 },
        sizes: {
            sm: { maxWidth: 12, maxHeight: 8.5 },
            md: { maxWidth: 18, maxHeight: 13 },
            lg: { maxWidth: 24, maxHeight: 17 },
        },
    },
];

export function getActiveConvention(): Convention | null {
    const today = new Date().toISOString().slice(0, 10);
    return CONVENTIONS.find((c) => today >= c.startDate && today <= c.endDate) ?? null;
}

// --- Mascots ---

export interface Mascot {
    id: string;
    name: string;
    path: string;
    thumbnail: string;
}

export const MASCOTS: Mascot[] = [
    { id: "amelia", name: "Amelia", path: `${BASE_PATH}/overlays/mascots/amelia.png`, thumbnail: `${BASE_PATH}/overlays/mascots/amelia.png` },
    { id: "amelia-v2", name: "Amelia v2", path: `${BASE_PATH}/overlays/mascots/amelia-v2.png`, thumbnail: `${BASE_PATH}/overlays/mascots/amelia-v2.png` },
    { id: "amelia-beer", name: "Amelia (Beer)", path: `${BASE_PATH}/overlays/mascots/amelia-beer.png`, thumbnail: `${BASE_PATH}/overlays/mascots/amelia-beer.png` },
    { id: "amelia-hug", name: "Amelia (Hug)", path: `${BASE_PATH}/overlays/mascots/amelia-hug.png`, thumbnail: `${BASE_PATH}/overlays/mascots/amelia-hug.png` },
    { id: "amelia-beer-alt", name: "Amelia (Beer Alt)", path: `${BASE_PATH}/overlays/mascots/amelia-beer-alt.png`, thumbnail: `${BASE_PATH}/overlays/mascots/amelia-beer-alt.png` },
];

export const DEFAULT_MASCOT_ID = "amelia";

// --- Layout presets ---
// Single source of truth for all overlay positioning and sizing.
// `inset` is the universal distance from the screen edge (in rem) — every
// element in the layout uses it, so everything lines up automatically.

type Bp<T> = { sm: T; md: T; lg: T };

export interface LayoutPreset {
    id: string;
    name: string;
    description: string;
    // Default edge distance — elements use this unless they have their own padding
    inset: Bp<number>;
    // Per-element padding overrides inset when set (e.g. mascot flush to edge = padding 0)
    logo: { position: OverlayPosition; size: Bp<number>; padding?: Bp<number> };
    mascot: { position: OverlayPosition; opacity: number; sizes: Bp<OverlaySize>; padding?: Bp<number> };
    convention: { position: OverlayPosition; padding?: Bp<number> };
    title: { fontSize: Bp<number> };
    qr: { opacity: number; position: OverlayPosition; size: Bp<number>; padding?: Bp<number> };
    date: { fontSize: Bp<number>; bottomPercent: Bp<number> };
    corners: { size: Bp<number>; padding?: Bp<number> };
}

export const LAYOUTS: LayoutPreset[] = [
    {
        id: "classic",
        name: "Classic",
        description: "Standard DAC layout",
        inset: { sm: 0.5, md: 0.5, lg: 0.5 },
        logo: { position: "top-left", padding: { sm: 1, md: 1, lg: 1 }, size: { sm: 4, md: 4, lg: 4.5 } },
        mascot: {
            position: "bottom-right",
            opacity: 0.85,
            padding: { sm: 1, md: 1, lg: 1 },
            sizes: {
                sm: { maxWidth: 5, maxHeight: 15 },
                md: { maxWidth: 10, maxHeight: 22 },
                lg: { maxWidth: 15, maxHeight: 26 },
            },
        },
        convention: { position: "bottom-left", padding: { sm: 0.25, md: 0.5, lg: 0.5 } },
        title: { fontSize: { sm: 1.25, md: 1.25, lg: 1.5 } },
        qr: { opacity: 0.8, position: "top-right", size: { sm: 5, md: 6.5, lg: 8 } },
        date: {
            fontSize: { sm: 0.5, md: 0.6875, lg: 0.875 },
            bottomPercent: { sm: 1.2, md: 1.5, lg: 1.5 },
        },
        corners: { size: { sm: 4.5, md: 4.5, lg: 4.5 } },
    },
    {
        // Mirrored classic: logo+title top-right, QR top-left, mascot bottom-left
        id: "flipped",
        name: "Flipped",
        description: "Classic layout mirrored",
        inset: { sm: 0.5, md: 0.5, lg: 0.5 },
        logo: { position: "top-right", padding: { sm: 1, md: 1, lg: 1 }, size: { sm: 5, md: 4, lg: 4.5 } },
        mascot: {
            position: "bottom-left",
            opacity: 0.85,
            padding: { sm: 1, md: 1, lg: 1 },
            sizes: {
                sm: { maxWidth: 5, maxHeight: 15 },
                md: { maxWidth: 10, maxHeight: 22 },
                lg: { maxWidth: 15, maxHeight: 26 },
            },
        },
        convention: { position: "bottom-right", padding: { sm: 0.25, md: 0.5, lg: 0.5 } },
        title: { fontSize: { sm: 1.25, md: 1.25, lg: 1.5 } },
        qr: { opacity: 0.8, position: "top-left", padding: { sm: 1, md: 1, lg: 1 }, size: { sm: 5, md: 6.5, lg: 8 } },
        date: {
            fontSize: { sm: 0.5, md: 0.6875, lg: 0.875 },
            bottomPercent: { sm: 1.2, md: 1.5, lg: 1.5 },
        },
        corners: { size: { sm: 4.5, md: 4.5, lg: 4.5 } },
    },
    {
        // Big mascot fills the corner, everything else stays the same size
        id: "hero",
        name: "Hero",
        description: "Mascot takes the stage",
        inset: { sm: 0.5, md: 0.5, lg: 0.5 },
        logo: { position: "top-left", padding: { sm: 1, md: 1, lg: 1 }, size: { sm: 5, md: 4, lg: 4.5 } },
        mascot: {
            position: "bottom-right",
            opacity: 0.9,
            padding: { sm: 0, md: 0, lg: 0 },
            sizes: {
                sm: { maxWidth: 12, maxHeight: 20 },
                md: { maxWidth: 18, maxHeight: 28 },
                lg: { maxWidth: 24, maxHeight: 34 },
            },
        },
        convention: { position: "bottom-left", padding: { sm: 0.25, md: 0.5, lg: 0.5 } },
        title: { fontSize: { sm: 1.25, md: 1.25, lg: 1.5 } },
        qr: { opacity: 0.8, position: "top-right", padding: { sm: 1, md: 1, lg: 1 }, size: { sm: 5, md: 6.5, lg: 8 } },
        date: {
            fontSize: { sm: 0.5, md: 0.6875, lg: 0.875 },
            bottomPercent: { sm: 1.2, md: 1.5, lg: 1.5 },
        },
        corners: { size: { sm: 4.5, md: 4.5, lg: 4.5 } },
    },
];

export const DEFAULT_LAYOUT_ID = "classic";