import { NextResponse } from "next/server";
import type { SendPhotoRequest, ApiResponse } from "@/lib/types";
import { DISCORD_MESSAGE } from "@/lib/config";

export const runtime = "nodejs";

const MAX_BODY_SIZE = 15 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 6;

const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = requestLog.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  requestLog.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

function errorResponse(error: string, status: number): NextResponse<ApiResponse> {
  console.error(`[send-photo] ${error}`);
  return NextResponse.json({ success: false, error }, { status });
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse>> {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    if (isRateLimited(ip)) {
      return errorResponse("Te veel verzoeken. Probeer het zo opnieuw.", 429);
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BODY_SIZE) {
      return errorResponse("Payload te groot", 413);
    }

    const body = await request.text();
    if (body.length > MAX_BODY_SIZE) {
      return errorResponse("Payload te groot", 413);
    }

    let parsed: SendPhotoRequest;
    try {
      parsed = JSON.parse(body);
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    if (!parsed.imageBase64 || typeof parsed.imageBase64 !== "string") {
      return errorResponse("Missing imageBase64 field", 400);
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      return errorResponse("DISCORD_WEBHOOK_URL not configured", 500);
    }

    const base64Data = parsed.imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    console.log(`[send-photo] Image size: ${(buffer.length / 1024).toFixed(0)}KB`);

    const file = new File([buffer], `photobooth-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("payload_json", JSON.stringify({ content: DISCORD_MESSAGE }));

    const res = await fetch(webhookUrl, { method: "POST", body: formData });

    if (res.status === 429) {
      return errorResponse("Discord is even overbelast, probeer het zo opnieuw.", 429);
    }

    if (!res.ok) {
      const text = await res.text();
      return errorResponse(`Discord returned ${res.status}: ${text}`, 502);
    }

    console.log("[send-photo] Successfully sent to Discord");
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(message, 500);
  }
}
