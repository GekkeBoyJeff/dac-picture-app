const WEBHOOK_URL = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL || "";

export async function sendToDiscord(imageBase64: string): Promise<boolean> {
  if (!WEBHOOK_URL) {
    console.warn("Discord webhook URL not configured");
    return false;
  }

  try {
    // Convert base64 to blob
    const res = await fetch(imageBase64);
    const blob = await res.blob();

    // Send directly to Discord webhook from browser
    const formData = new FormData();
    formData.append("content", "\u{1F4F8} Nieuwe foto uit de photobooth!");
    formData.append("files[0]", blob, `photobooth-${Date.now()}.jpg`);

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      body: formData,
    });

    return response.ok;
  } catch (err) {
    console.error("Discord send failed:", err);
    return false;
  }
}
