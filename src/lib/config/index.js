// Re-export overlay asset paths
export { CORNERS, LOGO, QR_CODE } from "./overlays"

// Re-export presets (conventions, mascots, layouts)
export {
  CONVENTIONS,
  getActiveConvention,
  MASCOTS,
  DEFAULT_MASCOT_ID,
  LAYOUTS,
  DEFAULT_LAYOUT_ID,
} from "./presets"

// -- Image export --

export const IMAGE = {
  EXPORT_QUALITY: 0.9,
  FORMAT: "image/webp",
}

// -- Gallery --

export const GALLERY = {
  MAX_PHOTOS: 20,
}

// -- Countdown --

export const COUNTDOWN_SECONDS = 3

// -- Gesture detection --

export const DEFAULT_GESTURE_HOLD_MS = 1500
export const LOOK_UP_PROMPT_ENABLED = true

// -- Toast --

export const TOAST_DURATION_MS = 1500
export const TOAST_ACTION_DURATION_MS = 5000

// -- Photo strip --

export const STRIP_PHOTO_COUNT = 3

export const STRIP_CANVAS = {
  WIDTH: 1080,
  HEIGHT: 1920,
  MARGIN_X: 40,
  PHOTO_TOP: 36,
  PHOTO_HEIGHT: 460,
  PHOTO_GAP: 16,
  BORDER_RADIUS: 12,
  BRANDING_Y: 1460,
  ACCENT_COLOR: "#e6c189",
  BG_COLOR: "#0a0a0a",
  LOGO_SIZE: 100,
  QR_SIZE: 140,
  MASCOT_MAX_HEIGHT: 520,
  MASCOT_MAX_WIDTH: 340,
  CONVENTION_BANNER_MAX_H: 140,
  CONVENTION_BANNER_MAX_W: 420,
}

// -- Gesture sequences --

export const GESTURE_SEQUENCE_OPEN = ["Open_Palm", "Closed_Fist", "Open_Palm", "Closed_Fist"]
export const GESTURE_SEQUENCE_CLOSE = ["Open_Palm", "Closed_Fist"]
export const GESTURE_SEQUENCE_STEP_HOLD_MS = 200
export const GESTURE_SEQUENCE_TIMEOUT_MS = 5000

// -- Gesture swipe (layout slider navigation) --

export const GESTURE_SWIPE_ENGAGE_MS = 500
export const GESTURE_SWIPE_DEAD_ZONE = 0.03
export const GESTURE_SWIPE_SNAP_THRESHOLD = 0.25

// -- Strip branding (text + fonts for canvas composition) --

export const STRIP_BRANDING = {
  COMMUNITY_NAME: "Dutch Anime Community",
  DISCORD_CTA: "Word lid\nvan DAC",
  DATE_LOCALE: "nl-NL",
  FONT_HEADING: "700 56px 'Geist', 'Inter', Arial, sans-serif",
  FONT_CONVENTION: "500 38px 'Geist', 'Inter', Arial, sans-serif",
  FONT_DATE: "400 32px 'Geist', 'Inter', Arial, sans-serif",
  FONT_SMALL: "400 26px 'Geist', 'Inter', Arial, sans-serif",
}

// -- Discord --

export const DISCORD_MESSAGE =
  "\u{1F4F8} Nieuwe foto uit de photobooth! Welkom bij Dutch Anime Community! \u{1F389}\nGa naar <#684064008827174930> om je te laten verifi\u00EBren en praat mee met de grootste anime community van de Benelux! \u{1F680}"