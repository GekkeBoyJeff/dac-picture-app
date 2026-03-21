import type { ApiResponse } from "./types";

export async function sendToDiscord(imageBase64: string): Promise<boolean> {
  try {
    const res = await fetch("/api/send-photo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!res.ok) {
      const data: ApiResponse = await res.json().catch(() => ({
        success: false,
        error: `HTTP ${res.status}`,
      }));
      console.error("Discord send failed:", data.error);
      return false;
    }

    const data: ApiResponse = await res.json();
    return data.success;
  } catch (err) {
    console.error("Network error sending to Discord:", err);
    return false;
  }
}
