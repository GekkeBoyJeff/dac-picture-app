// Re-export overlay asset paths
export { CORNERS, LOGO, QR_CODE } from "./overlays"

// Re-export presets (conventions, mascots, layouts)
export {
  CONVENTIONS, getActiveConvention,
  MASCOTS, DEFAULT_MASCOT_ID,
  LAYOUTS, DEFAULT_LAYOUT_ID,
} from "./presets"

// --- App settings ---
// Small enough to live here instead of separate files.

export const IMAGE = {
  EXPORT_QUALITY: 1.0,
  GALLERY_QUALITY: 0.75,
  FORMAT: "image/webp",
}

export const GALLERY = {
  MAX_PHOTOS: 20,
  STORAGE_KEY: "photobooth-gallery",
}

export const COUNTDOWN_SECONDS = 5

/** How long (ms) the user must hold the gesture before triggering the countdown */
export const DEFAULT_GESTURE_HOLD_MS = 1500

/** Shows an arrow prompting the user to look up at the camera during countdown */
export const LOOK_UP_PROMPT_ENABLED = true

export const TOAST_DURATION_MS = 1500

export const DISCORD_MESSAGE =
  "📸 Nieuwe foto uit de photobooth! Welkom bij Dutch Anime Community! 🎉\nGa naar <#684064008827174930> om je te laten verifiëren en praat mee met de grootste anime community van de Benelux! 🚀"