import { DISCORD_MESSAGE } from "@/lib/config"
import { logger } from "@/lib/logger"

const WEBHOOK_URL = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL || ""

/**
 * Send a photo to Discord via webhook.
 * @param {Blob} imageBlob
 * @returns {Promise<{ok: boolean, retryAfterMs: number}>}
 */
export async function sendToDiscord(imageBlob) {
  if (!WEBHOOK_URL) {
    logger.warn("discord", "Webhook URL not configured")
    return { ok: false, retryAfterMs: 0 }
  }

  try {
    const formData = new FormData()
    formData.append("content", DISCORD_MESSAGE)
    formData.append("files[0]", imageBlob, `photobooth-${Date.now()}.webp`)

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      body: formData,
    })

    // Respect Discord rate limits
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After")
      logger.warn("discord", "Rate limited, retry after", retryAfter)
      return { ok: false, retryAfterMs: (Number(retryAfter) || 5) * 1000 }
    }

    return { ok: response.ok, retryAfterMs: 0 }
  } catch (err) {
    logger.error("discord", "Send failed:", err)
    return { ok: false, retryAfterMs: 0 }
  }
}