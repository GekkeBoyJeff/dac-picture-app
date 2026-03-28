import nl from "./nl"
import en from "./en"

const locales = { nl, en }

let currentLocale = "nl"

/**
 * Set the active locale
 * @param {"nl"|"en"} locale
 */
export function setLocale(locale) {
  if (locales[locale]) {
    currentLocale = locale
  }
}

/**
 * Get the current locale
 * @returns {"nl"|"en"}
 */
export function getLocale() {
  return currentLocale
}

/**
 * Translate a key with optional interpolation.
 * @param {string} key - Translation key (e.g. "capture_button")
 * @param {Record<string, string|number>} [params] - Interpolation params (e.g. { count: 5 })
 * @returns {string}
 *
 * @example
 *   t("queue_pending", { count: 3 }) // "3 foto's in wachtrij"
 */
export function t(key, params) {
  const messages = locales[currentLocale] || locales.nl
  let text = messages[key] || locales.nl[key] || key

  if (params) {
    for (const [param, value] of Object.entries(params)) {
      text = text.replace(`{{${param}}}`, String(value))
    }
  }

  return text
}