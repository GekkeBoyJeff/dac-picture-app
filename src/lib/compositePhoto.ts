import type { OverlayConfig } from "./types";
import { IMAGE, VIDEO, CORNERS, CORNER_SIZE, CORNER_OFFSET, QR_CODE } from "./config";

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

function getDesignScale(canvasW: number, canvasH: number): number {
  const isPortrait = canvasH > canvasW;
  const designW = isPortrait ? VIDEO.DESIGN_HEIGHT : VIDEO.DESIGN_WIDTH;
  const designH = isPortrait ? VIDEO.DESIGN_WIDTH : VIDEO.DESIGN_HEIGHT;
  return Math.min(canvasW / designW, canvasH / designH);
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

  // Uniform scale so overlays keep correct proportions on any aspect ratio
  const scale = getDesignScale(canvasW, canvasH);
  const scaledMaxW = config.maxWidth * scale;
  const scaledMaxH = config.maxHeight * scale;
  const scaledPad = config.padding * scale;

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

  // Uniform scale for all decorations
  const scale = getDesignScale(width, height);

  const cornerResults = await Promise.allSettled(
    CORNERS.map((c) => loadImage(c.src).then((img) => ({ img, position: c.position })))
  );
  const scaledCornerSize = CORNER_SIZE * scale;
  const scaledCornerOffset = CORNER_OFFSET * scale;
  for (const result of cornerResults) {
    if (result.status === "rejected") continue;
    const { img, position } = result.value;
    const x = position.includes("left") ? scaledCornerOffset : width - scaledCornerSize - scaledCornerOffset;
    const y = position.includes("top") ? scaledCornerOffset : height - scaledCornerSize - scaledCornerOffset;
    ctx.drawImage(img, x, y, scaledCornerSize, scaledCornerSize);
  }

  // Draw text overlays
  {
    // "Dutch Anime Community" title
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.font = `600 ${24 * scale}px Arial, sans-serif`;
    ctx.fillStyle = "white";
    ctx.letterSpacing = `${4 * scale}px`;
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 12 * scale;
    ctx.shadowOffsetY = 2 * scale;
    ctx.fillText("DUTCH ANIME", 100 * scale, 48 * scale);
    ctx.fillText("COMMUNITY", 100 * scale, 74 * scale);
    ctx.restore();

    // Date stamp
    const today = new Date().toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.font = `${14 * scale}px 'Courier New', monospace`;
    ctx.fillStyle = "white";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 4 * scale;
    const textWidth = ctx.measureText(today).width;
    ctx.fillText(today, (width - textWidth) / 2, height * 0.968);
    ctx.restore();
  }

  // Draw QR code
  try {
    const qrImg = await loadImage(QR_CODE.src);
    const qrSize = QR_CODE.size * scale;
    ctx.save();
    ctx.globalAlpha = QR_CODE.opacity;
    ctx.drawImage(qrImg, QR_CODE.left * scale, QR_CODE.top * scale, qrSize, qrSize);
    ctx.restore();
  } catch {
    // QR code load failed — continue without it
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
