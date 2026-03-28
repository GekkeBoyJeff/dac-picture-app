// Re-export overlay asset paths
export { CORNERS, LOGO, QR_CODE } from "./overlays"

// Re-export presets (conventions, mascots, layouts)
export {
  CONVENTIONS, getActiveConvention,
  MASCOTS, DEFAULT_MASCOT_ID,
  LAYOUTS, DEFAULT_LAYOUT_ID,
} from "./presets"

// --- App settings ---

export const IMAGE = {
  EXPORT_QUALITY: 1.0,
  GALLERY_QUALITY: 0.75,
  FORMAT: "image/webp",
}

export const GALLERY = {
  MAX_PHOTOS: 20,
  STORAGE_KEY: "photobooth-gallery",
}

export const COUNTDOWN_SECONDS = 3

/** How long (ms) the user must hold the gesture before triggering the countdown */
export const DEFAULT_GESTURE_HOLD_MS = 1500

/** Shows an arrow prompting the user to look up at the camera during countdown */
export const LOOK_UP_PROMPT_ENABLED = true

export const TOAST_DURATION_MS = 1500
export const TOAST_ACTION_DURATION_MS = 5000

// --- Photo strip ---
export const STRIP_PHOTO_COUNT = 3
export const STRIP_PAUSE_MS = 2000
export const STRIP_CANVAS = {
  WIDTH: 1080,
  HEIGHT: 1920,
  MARGIN_X: 40,
  PHOTO_TOP: 40,
  PHOTO_HEIGHT: 500,
  PHOTO_GAP: 18,
  BORDER_RADIUS: 12,
  BRANDING_Y: 1598,
  ACCENT_COLOR: "#e6c189",
  BG_COLOR: "#0a0a0a",
  LOGO_SIZE: 44,
  QR_SIZE: 64,
  MASCOT_MAX_HEIGHT: 440,
  MASCOT_MAX_WIDTH: 300,
  CONVENTION_BANNER_MAX_H: 48,
  CONVENTION_BANNER_MAX_W: 160,
}

// --- Gesture sequences ---
export const GESTURE_SEQUENCE_OPEN = ["Open_Palm", "Closed_Fist", "Open_Palm", "Closed_Fist"]
export const GESTURE_SEQUENCE_CLOSE = ["Open_Palm", "Closed_Fist"]
export const GESTURE_SEQUENCE_STEP_HOLD_MS = 200
export const GESTURE_SEQUENCE_TIMEOUT_MS = 5000

// --- Gesture swipe (layout slider navigation) ---
export const GESTURE_SWIPE_ENGAGE_MS = 500
export const GESTURE_SWIPE_DEAD_ZONE = 0.03
export const GESTURE_SWIPE_SNAP_THRESHOLD = 0.25

// --- Strip branding (text + fonts for canvas composition) ---
export const STRIP_BRANDING = {
  COMMUNITY_NAME: "Dutch Anime Community",
  DISCORD_CTA: "Join our Discord",
  DATE_LOCALE: "nl-NL",
  FONT_HEADING: "600 20px 'Geist', 'Inter', Arial, sans-serif",
  FONT_CONVENTION: "500 14px 'Geist', 'Inter', Arial, sans-serif",
  FONT_DATE: "400 13px 'Geist', 'Inter', Arial, sans-serif",
  FONT_SMALL: "400 12px 'Geist', 'Inter', Arial, sans-serif",
}

export const DISCORD_MESSAGE =
  "📸 Nieuwe foto uit de photobooth! Welkom bij Dutch Anime Community! 🎉\nGa naar <#684064008827174930> om je te laten verifiëren en praat mee met de grootste anime community van de Benelux! 🚀"