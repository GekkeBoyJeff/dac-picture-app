import { IMAGE } from "./config";

// Overlay images are cached across captures to avoid re-fetching on every photo.
const imageCache = new Map();

function loadImage(src) {
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

// Cap canvas size to prevent mobile browsers from running out of memory on 4K cameras.
const MAX_PIXELS = 1920 * 1080;

/**
 * Creates a photo by reading overlay positions directly from the DOM.
 *
 * Why DOM measurement instead of recalculating positions in JS?
 * CSS is the single source of truth for overlay placement. By reading
 * getBoundingClientRect() at capture time, the photo is guaranteed to
 * match the on-screen preview exactly — regardless of screen size,
 * orientation, or aspect ratio. No duplication of layout logic needed.
 *
 * @param {HTMLVideoElement} video
 * @param {HTMLElement} container
 * @param {boolean} [mirror=true]
 * @returns {Promise<{exportBlob: Blob, galleryDataUrl: string}>}
 */
export async function compositePhoto(video, container, mirror = true) {
  const containerRect = container.getBoundingClientRect();
  const containerAspect = containerRect.width / containerRect.height;

  // --- Video crop (replicate object-cover) ---
  const vw = video.videoWidth || 1920;
  const vh = video.videoHeight || 1080;
  const videoAspect = vw / vh;

  let srcX = 0;
  let srcY = 0;
  let srcW = vw;
  let srcH = vh;

  if (videoAspect > containerAspect) {
    srcW = Math.round(vh * containerAspect);
    srcX = Math.round((vw - srcW) / 2);
  } else if (videoAspect < containerAspect) {
    srcH = Math.round(vw / containerAspect);
    srcY = Math.round((vh - srcH) / 2);
  }

  // --- Canvas setup ---
  let canvasW = srcW;
  let canvasH = srcH;
  if (canvasW * canvasH > MAX_PIXELS) {
    const s = Math.sqrt(MAX_PIXELS / (canvasW * canvasH));
    canvasW = Math.round(canvasW * s);
    canvasH = Math.round(canvasH * s);
  }

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas 2D context");

  // --- Draw video ---
  if (mirror) {
    ctx.save();
    ctx.translate(canvasW, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, canvasW, canvasH);
    ctx.restore();
  } else {
    ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, canvasW, canvasH);
  }

  // --- Scale factors: canvas pixels per screen pixel ---
  const scaleX = canvasW / containerRect.width;
  const scaleY = canvasH / containerRect.height;

  // --- Vignettes (procedural — always full-canvas) ---
  drawVignettes(ctx, canvasW, canvasH);

  // --- Image overlays (corners, main overlays, QR) ---
  const imageEls = container.querySelectorAll(
    '[data-overlay="corner"], [data-overlay="image"], [data-overlay="qr"]',
  );

  const imageDraws = Array.from(imageEls).map(async (el) => {
    const src = el.src || el.getAttribute("src");
    if (!src) return;

    try {
      const img = await loadImage(src);
      const elRect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const objectFit = style.objectFit;

      let x = (elRect.left - containerRect.left) * scaleX;
      let y = (elRect.top - containerRect.top) * scaleY;
      let w = elRect.width * scaleX;
      let h = elRect.height * scaleY;

      // When CSS uses object-fit: contain, the browser renders the image
      // smaller than the element box. getBoundingClientRect returns the BOX
      // size, not the image size — so we must recalculate to avoid stretching.
      if (objectFit === "contain" && img.naturalWidth && img.naturalHeight) {
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const boxW = elRect.width;
        const boxH = elRect.height;
        let renderW;
        let renderH;

        if (boxW / boxH > imgAspect) {
          renderH = boxH;
          renderW = boxH * imgAspect;
        } else {
          renderW = boxW;
          renderH = boxW / imgAspect;
        }

        // Center within box (default object-position)
        const offsetX = (boxW - renderW) / 2;
        const offsetY = (boxH - renderH) / 2;

        x = (elRect.left - containerRect.left + offsetX) * scaleX;
        y = (elRect.top - containerRect.top + offsetY) * scaleY;
        w = renderW * scaleX;
        h = renderH * scaleY;
      }

      const opacity = parseFloat(style.opacity);
      const filter = style.filter;

      ctx.save();
      if (!isNaN(opacity)) ctx.globalAlpha = opacity;
      if (filter && filter !== "none") ctx.filter = filter;
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();
    } catch (err) {
      console.warn("Overlay failed:", src, err);
    }
  });

  await Promise.all(imageDraws);

  // --- Title text ---
  const titleEl = container.querySelector('[data-overlay="title"]');
  if (titleEl) {
    drawTitle(ctx, titleEl, containerRect, scaleX, scaleY);
  }

  // --- Date stamp ---
  const dateEl = container.querySelector('[data-overlay="date"]');
  if (dateEl) {
    drawDate(ctx, dateEl, containerRect, scaleX, scaleY);
  }

  const exportBlob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      IMAGE.FORMAT,
      IMAGE.EXPORT_QUALITY,
    );
  });

  const galleryDataUrl = canvas.toDataURL(IMAGE.FORMAT, IMAGE.GALLERY_QUALITY);

  return { exportBlob, galleryDataUrl };
}

// ---------- Helpers ----------

function drawVignettes(ctx, w, h) {
  // Radial vignette
  const cx = w / 2;
  const cy = h / 2;
  const outerR = Math.sqrt(cx * cx + cy * cy);
  const radial = ctx.createRadialGradient(cx, cy, outerR * 0.35, cx, cy, outerR);
  radial.addColorStop(0, "transparent");
  radial.addColorStop(1, "rgba(0,0,0,0.4)");
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, w, h);

  // Bottom gradient (45% height)
  const bottomH = h * 0.45;
  const bottomGrad = ctx.createLinearGradient(0, h - bottomH, 0, h);
  bottomGrad.addColorStop(0, "transparent");
  bottomGrad.addColorStop(0.4, "rgba(0,0,0,0.2)");
  bottomGrad.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, h - bottomH, w, bottomH);

  // Top gradient (20% height)
  const topH = h * 0.2;
  const topGrad = ctx.createLinearGradient(0, 0, 0, topH);
  topGrad.addColorStop(0, "rgba(0,0,0,0.4)");
  topGrad.addColorStop(1, "transparent");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, w, topH);
}

function drawTitle(ctx, el, containerRect, scaleX, scaleY) {
  const span = el.querySelector("span");
  if (!span) return;

  const style = getComputedStyle(span);
  const elRect = el.getBoundingClientRect();
  const fontSize = parseFloat(style.fontSize) * scaleY;
  const x = (elRect.left - containerRect.left) * scaleX;
  const y = (elRect.top - containerRect.top) * scaleY;

  ctx.save();
  ctx.globalAlpha = parseFloat(style.opacity) || 0.9;
  ctx.font = `600 ${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = "white";
  ctx.letterSpacing = `${parseFloat(style.letterSpacing || "0") * scaleX}px`;
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 12 * Math.min(scaleX, scaleY);
  ctx.shadowOffsetY = 2 * scaleY;

  // The title has two lines: "Dutch Anime" and "Community"
  // Measure actual line height from the span's computed style
  const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.2;
  const scaledLineHeight = lineHeight * scaleY;

  ctx.fillText("DUTCH ANIME", x, y + fontSize);
  ctx.fillText("COMMUNITY", x, y + fontSize + scaledLineHeight);
  ctx.restore();
}

function drawDate(ctx, el, containerRect, scaleX, scaleY) {
  const style = getComputedStyle(el);
  const elRect = el.getBoundingClientRect();
  const fontSize = parseFloat(style.fontSize) * scaleY;

  const text = el.textContent || "";
  const x = (elRect.left - containerRect.left) * scaleX;
  const y = (elRect.top - containerRect.top) * scaleY;

  ctx.save();
  ctx.globalAlpha = parseFloat(style.opacity) || 0.7;
  ctx.font = `${fontSize}px 'Courier New', monospace`;
  ctx.fillStyle = "white";
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 4 * Math.min(scaleX, scaleY);
  ctx.fillText(text, x, y + fontSize);
  ctx.restore();
}
