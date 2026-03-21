import type { OverlayConfig, TextOverlayConfig } from "./types";
import { IMAGE, VIDEO } from "./config";

const imageCache = new Map<string, HTMLImageElement>();

function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load overlay: ${src}`));
    img.src = src;
  });
}

function calcDrawRect(
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number,
  config: OverlayConfig
): { x: number; y: number; w: number; h: number } {
  if (config.position === "full") {
    return { x: 0, y: 0, w: canvasW, h: canvasH };
  }

  const scaleX = canvasW / VIDEO.DESIGN_WIDTH;
  const scaleY = canvasH / VIDEO.DESIGN_HEIGHT;
  const scaledMaxW = config.maxWidth * scaleX;
  const scaledMaxH = config.maxHeight * scaleY;
  const scaledPad = config.padding * scaleX;

  const aspect = img.naturalWidth / img.naturalHeight;
  let w = Math.min(scaledMaxW, canvasW * 0.4);
  let h = w / aspect;

  if (h > scaledMaxH) {
    h = scaledMaxH;
    w = h * aspect;
  }

  let x = scaledPad;
  let y = scaledPad;

  if (config.position === "middle-right") {
    return { x: canvasW - w - scaledPad, y: (canvasH - h) / 2, w, h };
  }
  if (config.position.includes("right")) x = canvasW - w - scaledPad;
  if (config.position.includes("bottom")) y = canvasH - h - scaledPad;

  return { x, y, w, h };
}

interface CompositeResult {
  exportDataUrl: string;
  galleryDataUrl: string;
  blob: Blob;
}

export async function compositePhoto(
  video: HTMLVideoElement,
  overlays: OverlayConfig[],
  textOverlays?: TextOverlayConfig[],
  mirror: boolean = true
): Promise<CompositeResult> {
  const width = video.videoWidth || 1920;
  const height = video.videoHeight || 1080;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas 2D context");

  if (mirror) {
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();
  } else {
    ctx.drawImage(video, 0, 0, width, height);
  }

  const loadResults = await Promise.allSettled(
    overlays.map((config) => loadImage(config.path).then((img) => ({ img, config })))
  );

  for (const result of loadResults) {
    if (result.status === "rejected") {
      console.warn(result.reason instanceof Error ? result.reason.message : "Overlay failed");
      continue;
    }
    const { img, config } = result.value;
    const { x, y, w, h } = calcDrawRect(img, width, height, config);

    ctx.save();
    ctx.globalAlpha = config.opacity;
    if (config.invert) ctx.filter = "brightness(0) invert(1)";
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  }

  if (textOverlays) {
    const sx = width / VIDEO.DESIGN_WIDTH;
    const sy = height / VIDEO.DESIGN_HEIGHT;

    for (const t of textOverlays) {
      ctx.save();
      ctx.globalAlpha = t.opacity;
      ctx.font = `${t.fontSize * sy}px ${t.font}`;
      ctx.fillStyle = t.color;
      if (t.letterSpacing) ctx.letterSpacing = `${t.letterSpacing * sx}px`;
      ctx.fillText(t.text, t.x * sx, t.y * sy);
      ctx.restore();
    }
  }

  const exportDataUrl = canvas.toDataURL(IMAGE.FORMAT, IMAGE.EXPORT_QUALITY);
  const galleryDataUrl = canvas.toDataURL(IMAGE.FORMAT, IMAGE.GALLERY_QUALITY);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
      IMAGE.FORMAT,
      IMAGE.EXPORT_QUALITY
    )
  );

  return { exportDataUrl, galleryDataUrl, blob };
}
