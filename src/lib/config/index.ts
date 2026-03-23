// Re-export overlay asset paths
export { CORNERS, LOGO, QR_CODE } from "./overlays";

// Re-export presets (conventions, mascots, layouts)
export {
  CONVENTIONS, getActiveConvention, type Convention,
  MASCOTS, DEFAULT_MASCOT_ID, type Mascot,
  LAYOUTS, DEFAULT_LAYOUT_ID, type LayoutPreset,
} from "./presets";

// --- App settings ---
// Small enough to live here instead of separate files.

export const IMAGE = {
  EXPORT_QUALITY: 1.0,
  GALLERY_QUALITY: 0.75,
  FORMAT: "image/webp" as const,
} as const;

export const GALLERY = {
  MAX_PHOTOS: 20,
  STORAGE_KEY: "photobooth-gallery",
} as const;

export const COUNTDOWN_SECONDS = 5;

/** Shows an arrow prompting the user to look up at the camera during countdown */
export const LOOK_UP_PROMPT_ENABLED = true;

export const TOAST_DURATION_MS = 1500;

export const DISCORD_MESSAGE =
  "📸 New photo from the photobooth! Welcome to the Dutch Anime Community! 🎉\nGo to <#684064008827174930> to verify and join the biggest anime community of the Benelux! 🚀";
