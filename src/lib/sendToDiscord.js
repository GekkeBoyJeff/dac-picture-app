import { DISCORD_MESSAGE } from "./config"

const WEBHOOK_URL = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL || ""

export async function sendToDiscord(imageBlob) {
  if (!WEBHOOK_URL) {
    console.warn("Discord webhook URL not configured")
    return false
  }

  try {
    const formData = new FormData()
    formData.append("content", DISCORD_MESSAGE)
    formData.append("files[0]", imageBlob, `photobooth-${Date.now()}.webp`)

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      body: formData,
    })

    return response.ok
  } catch (err) {
    console.error("Discord send failed:", err)
    return false
  }
}