# Raspberry Pi Browser Capabilities for DAC Fotobooth PWA

Research compiled for running a PWA photo booth application in Chromium on Raspberry Pi (Pi 4 / Pi 5) in kiosk mode.

---

## 1. Auto-Detecting Raspberry Pi from the Browser

### navigator.userAgent

RPi OS Chromium **masquerades as Chrome OS** for Widevine DRM compatibility. The ChromeOS version number is hardcoded in the RPi-specific Chromium patches and does not update automatically.

| OS bitness | Example user agent |
|---|---|
| 64-bit (aarch64) | `Mozilla/5.0 (X11; CrOS aarch64 13597.84.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.5672.95 Safari/537.36` |
| 32-bit (armv7l) | `Mozilla/5.0 (X11; CrOS armv7l 13597.84.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.105 Safari/537.36` |

**Detection strategy:** Check for `CrOS aarch64` or `CrOS armv7l` in the user agent. This identifies Raspberry Pi OS Chromium specifically, because real Chrome OS on ARM Chromebooks uses different CrOS version strings and hardware identifiers. However, it is not 100% unique -- other CrOS ARM forks (FydeOS on Pi) produce similar strings.

**Reliability:** Medium-high. The CrOS spoofing is stable across RPi Chromium releases and unlikely to change because it is required for Widevine.

Sources:
- [Chromium user agent string on RpiOS](https://forums.raspberrypi.com/viewtopic.php?t=351055)
- [Changing the UserAgent of chromium on startup?](https://forums.raspberrypi.com/viewtopic.php?t=232305)
- [Chromium and widevine on 64-bit](https://forums.raspberrypi.com/viewtopic.php?t=347736)

### navigator.hardwareConcurrency

| Model | CPU | Expected value |
|---|---|---|
| Pi 4 | 4x Cortex-A72 @ 1.8 GHz | `4` |
| Pi 5 | 4x Cortex-A76 @ 2.4 GHz | `4` |

Both return `4`. This does not distinguish Pi 4 from Pi 5, but combined with `CrOS aarch64` in the UA it confirms a quad-core Pi.

**Reliability:** High. Accurately reports physical core count.

### navigator.deviceMemory

Returns an approximate value rounded to the nearest power of 2, then divided by 1024. Only available in Chromium-based browsers (not Firefox/Safari).

| Model | RAM | Expected value |
|---|---|---|
| Pi 4 (1 GB) | 1 GB | `1` |
| Pi 4 (2 GB) | 2 GB | `2` |
| Pi 4 (4 GB) | 4 GB | `4` |
| Pi 4 (8 GB) | 8 GB | `8` |
| Pi 5 (4 GB) | 4 GB | `4` |
| Pi 5 (8 GB) | 8 GB | `8` |

**Reliability:** High. Useful for scaling feature tiers (e.g., disable MediaPipe on 1-2 GB models).

Source: [MDN: Navigator.deviceMemory](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/deviceMemory)

### WebGL Renderer String (GPU detection)

Query the GPU renderer via WebGL:

```js
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
const dbg = gl.getExtension('WEBGL_debug_renderer_info');
if (dbg) {
  const vendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);   // "Broadcom"
  const renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
}
```

| Model | GPU | Expected renderer |
|---|---|---|
| Pi 4 | VideoCore VI | `V3D 4.2` (via Mesa Gallium) |
| Pi 5 | VideoCore VII | `V3D 7.1` (via Mesa Gallium) |

**Reliability:** High when WebGL is enabled. The renderer string uniquely identifies the Pi generation. Requires `chrome://flags/#ignore-gpu-blocklist` to be enabled (see kiosk flags below).

Sources:
- [Raspberry Pi 5 Graphics - Phoronix](https://www.phoronix.com/review/raspberry-pi-5-graphics)
- [WebGL support for the Pi](https://forums.raspberrypi.com/viewtopic.php?t=247473)

### Recommended Detection Function

```js
function detectRaspberryPi() {
  const ua = navigator.userAgent;
  const isCrOSArm = /CrOS (aarch64|armv7l)/.test(ua);

  let gpuRenderer = null;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    const dbg = gl?.getExtension('WEBGL_debug_renderer_info');
    if (dbg) gpuRenderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
  } catch { /* no WebGL */ }

  const isPi = isCrOSArm && /V3D/.test(gpuRenderer ?? '');
  const model =
    /V3D 7/.test(gpuRenderer ?? '') ? 'pi5' :
    /V3D 4/.test(gpuRenderer ?? '') ? 'pi4' :
    null;

  return {
    isPi,
    model,
    cores: navigator.hardwareConcurrency,
    memoryGB: navigator.deviceMemory,
    gpuRenderer,
    ua,
  };
}
```

---

## 2. Camera Capabilities on Pi

### USB Webcam vs Pi Camera Module

| Camera type | getUserMedia support | Notes |
|---|---|---|
| **USB webcam** | Works reliably | Standard V4L2 device, no extra drivers needed |
| **Pi Camera Module** | Problematic | Requires `sudo modprobe bcm2835-v4l2` to expose as V4L2 device. Historically unreliable in Chromium. The Camera Module 3 (IMX708) has improved but still has autofocus quirks via browser APIs |

**Recommendation:** Use a USB webcam for the photo booth. It is the most reliable path for `getUserMedia` on Pi.

### Maximum Resolution That Performs Well

| Resolution | Pi 4 | Pi 5 | Notes |
|---|---|---|---|
| 640x480 | Smooth | Smooth | Default Chromium falls back to this |
| 1280x720 | Good | Good | Sweet spot for photo booth |
| 1920x1080 | Can lag | Acceptable | High CPU, potential frame drops on Pi 4 |

Chromium has historically defaulted to 640x480 regardless of camera capability. You must explicitly request higher resolutions via constraints.

### getUserMedia Constraints That Work

```js
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 30 },
    facingMode: 'user',
  },
  audio: false,
});
```

**Important quirks:**
- Always set `ideal` rather than `exact` -- if the camera does not support the exact resolution, the call will fail entirely.
- Portrait orientation: Chromium on Pi only negotiates landscape resolutions. If you need portrait, capture landscape and rotate via CSS `transform: rotate(90deg)` or canvas post-processing.
- Some USB webcams enumerate as multiple devices (e.g., separate IR sensor). Use `navigator.mediaDevices.enumerateDevices()` to let the user pick or auto-select the correct one.

Sources:
- [RPi4 Webcam & Chromium](https://forums.raspberrypi.com/viewtopic.php?t=321147)
- [Camera Module 3 getUserMedia AutoFocus](https://forums.raspberrypi.com/viewtopic.php?p=2319834)
- [Max resolution for Camera v2.1 in Chromium](https://forums.raspberrypi.com/viewtopic.php?f=43&p=1709125)

---

## 3. Canvas Performance on Pi

### Maximum Canvas Size Before Slowdown

| Canvas size | Pi 4 | Pi 5 | Notes |
|---|---|---|---|
| 1280x720 | Fast | Fast | Recommended working size |
| 1920x1080 | Acceptable | Fast | Good for final output |
| 2560x1920 | Slow | Acceptable | Noticeable lag on Pi 4 |
| 4096x4096 | Avoid | Slow | GPU texture size limit territory |

The Chromium canvas is backed by GPU textures when hardware acceleration is on. The practical limit is the GPU's max texture size. VideoCore VI (Pi 4) supports up to 4096x4096, but performance degrades well before that.

**Rule of thumb:** Keep the working canvas at or below 1920x1080 on Pi 4. On Pi 5 you have more headroom thanks to the ~3x CPU improvement and faster V3D 7.1 GPU.

### 2D Context Performance

- `drawImage()` is the most-used operation for photo booth compositing. On Pi 4, a 1280x720 `drawImage` takes roughly 2-5 ms. On Pi 5 it drops to under 2 ms.
- `getImageData()` / `putImageData()` are CPU-bound pixel operations. Avoid per-frame use.
- Use `context.drawImage(video, ...)` to composite the camera feed directly rather than going through `getImageData`.
- Multiple `drawImage` calls compositing overlays (frames, stickers) at 1280x720 are fine at 30 fps on both Pi 4 and Pi 5.

### toBlob() Performance for WebP Encoding

| Format | Pi 4 (1280x720) | Pi 5 (1280x720) | Notes |
|---|---|---|---|
| image/jpeg (0.85) | ~50-100 ms | ~20-50 ms | Fastest option |
| image/webp (0.85) | ~150-300 ms | ~60-120 ms | Software-encoded, slower |
| image/png | ~200-400 ms | ~80-160 ms | Lossless, largest files |

**Recommendation:** Use JPEG for capture speed. WebP is fine for background export/upload but avoid it in the hot path (e.g., countdown -> capture -> show result).

### OffscreenCanvas

OffscreenCanvas is supported in Chromium on Pi (available since Chrome 69). It allows canvas rendering in a Web Worker, keeping the main thread free.

```js
const offscreen = new OffscreenCanvas(1280, 720);
const ctx = offscreen.getContext('2d');
// ... draw operations ...
const blob = await offscreen.convertToBlob({ type: 'image/jpeg', quality: 0.85 });
```

**Should you use it?** Yes, for the `toBlob` / `convertToBlob` encoding step. Offload the encoding to a worker so the UI thread stays responsive during the capture-to-save flow. Do not use it for the live preview rendering (that should stay on the main thread using `requestAnimationFrame`).

Sources:
- [Canvas drawImage() benchmark](https://gist.github.com/mjohnston/1a096e4feb7c40be3438)
- [Raspberry Pi 5 Performance Benchmarks](https://www.whypi.org/raspberry-pi-5-performance-benchmarks/)

---

## 4. MediaPipe on Pi

### Does MediaPipe Vision Run on Pi 4/5 in Chromium?

**Yes**, but with significant caveats. MediaPipe Vision tasks (hand landmarker, gesture recognizer) use WASM + XNNPACK for inference in the browser and do not strictly require a GPU.

### WASM vs WebGL Backend

| Backend | Pi 4 | Pi 5 | Recommendation |
|---|---|---|---|
| **WASM (CPU via XNNPACK)** | Works, slow | Works, usable | **Use this** |
| **WebGL** | Unreliable | Inconsistent | Avoid on Pi |

The WebGL backend requires decent GPU shader performance. The VideoCore GPUs on Pi are optimized for display compositing, not general-purpose shader compute. WASM with XNNPACK CPU inference is more predictable and stable.

### Expected Frame Rates for Hand Detection

| Task | Pi 4 (WASM) | Pi 5 (WASM) | Notes |
|---|---|---|---|
| Hand Landmark (1 hand) | 4-6 FPS | 10-15 FPS | Usable on Pi 5 for gesture triggers |
| Hand Landmark (2 hands) | 2-4 FPS | 6-10 FPS | Marginal on Pi 4 |
| Gesture Recognition | 4-6 FPS | 8-13 FPS | Similar to landmark perf |

Real-world benchmarks show native MediaPipe Python on Pi achieving 4-6 FPS (Pi 4) and ~10-13 FPS (Pi 5 with TFLite optimization). Browser WASM adds overhead, so expect the lower end of these ranges.

**For a photo booth:** You likely do not need continuous real-time tracking. Consider running detection only during specific phases (e.g., "raise hand to trigger countdown") at a reduced input resolution (e.g., 320x240 for the ML input, separate from the display feed).

### Memory Usage

MediaPipe Vision WASM runtime loads approximately 15-30 MB of WASM modules plus model files (hand landmarker model is ~5 MB). Total memory footprint: ~50-80 MB during active inference.

On a 4 GB Pi 4 this is manageable but adds to the overall Chromium pressure. On Pi 5 (8 GB) it is comfortable.

**Optimization tips:**
- Load MediaPipe lazily, only when the gesture feature is active.
- Dispose the recognizer when not in use: `handLandmarker.close()`.
- Use `VIDEO` running mode with a reduced resolution stream dedicated to ML inference.

Sources:
- [Install MediaPipe on a Raspberry Pi - Random Nerd Tutorials](https://randomnerdtutorials.com/install-mediapipe-raspberry-pi/)
- [Smart Home Control Using Hand Gesture Recognition on Pi 5](https://www.mdpi.com/2079-9292/14/20/3976)
- [MediaPipe Tasks Vision npm](https://www.npmjs.com/package/@mediapipe/tasks-vision)
- [MP Vision Tasks web solutions performance (GitHub issue)](https://github.com/google-ai-edge/mediapipe/issues/5377)
- [MediaPipe Pose Detection: Real-Time Performance Analysis](https://lb.lax.hackaday.io/project/203704/log/242569-mediapipe-pose-detection-real-time-performance-analysis)

---

## 5. PWA on Pi Chromium

### Service Worker Support

Chromium on Pi supports service workers. They work the same as on desktop Chromium. However, the PWA **install prompt** (the "Add to Home Screen" banner) is **not available** on Linux Chromium, including RPi OS.

**Workaround for kiosk:** You do not need the install prompt. The app runs directly in Chromium kiosk mode pointed at the URL. The service worker still caches assets and enables offline operation; you just skip the install step.

```bash
# Launch directly in kiosk -- service workers still register and cache
chromium-browser --kiosk https://localhost:3000
```

### IndexedDB Limits

Chromium on Pi follows the same quota rules as desktop Chromium:

| Condition | Quota |
|---|---|
| Free disk space > 1 GB | Up to 500 MB per origin |
| Free disk space < 1 GB | 50% of free disk space |
| Overall limit | ~60% of total disk capacity shared across all origins |

For a photo booth storing captured images temporarily in IndexedDB before upload, 500 MB is generous (hundreds of JPEG photos at 200-400 KB each).

**Important:** A `QuotaExceededError` is thrown when the limit is reached. Handle this gracefully -- e.g., prune oldest photos or alert the operator.

### Storage Persistence

Request persistent storage to prevent the browser from evicting cached data:

```js
if (navigator.storage && navigator.storage.persist) {
  const granted = await navigator.storage.persist();
  console.log('Persistent storage:', granted); // true on kiosk
}
```

On a dedicated kiosk device this is almost always granted.

### Kiosk Mode Setup

**Recommended launch command (Bookworm / Wayland):**

```bash
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --disable-translate \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --disable-features=TouchpadOverscrollHistoryNavigation \
  --enable-features=OverlayScrollbar \
  --check-for-update-interval=31536000 \
  --autoplay-policy=no-user-gesture-required \
  --ignore-gpu-blocklist \
  --enable-gpu-rasterization \
  --enable-zero-copy \
  https://localhost:3000
```

**Prevent "restore session" prompt after crash:**

Edit `~/.config/chromium/Default/Preferences` on startup:
```bash
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' \
  ~/.config/chromium/Default/Preferences
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' \
  ~/.config/chromium/Default/Preferences
```

**Autostart on boot** (systemd user service or `/etc/xdg/autostart/`):

```ini
# ~/.config/autostart/fotobooth.desktop
[Desktop Entry]
Type=Application
Name=DAC Fotobooth
Exec=/usr/bin/chromium-browser --kiosk --noerrdialogs --disable-infobars --no-first-run https://localhost:3000
X-GNOME-Autostart-enabled=true
```

Sources:
- [Official RPi Kiosk Tutorial](https://www.raspberrypi.com/tutorials/how-to-use-a-raspberry-pi-in-kiosk-mode/)
- [Kiosk mode on RPi 5 with Bookworm Lite (2025)](https://forums.raspberrypi.com/viewtopic.php?t=389880)
- [How to run Chromium in kiosk mode on a Raspberry Pi 2025](https://gist.github.com/lellky/673d84260dfa26fa9b57287e0f67d09e)
- [Setting up a Chromium kiosk on a Raspberry Pi](https://www.scalzotto.nl/posts/raspberry-pi-kiosk/)
- [Cannot install a PWA with Chromium or Firefox](https://forums.raspberrypi.com/viewtopic.php?t=298945)

---

## 6. Memory Management

### Available Memory for Chromium

| Model | Total RAM | Chromium available | Notes |
|---|---|---|---|
| Pi 4 (4 GB) | 4 GB | ~2.5-3 GB | OS + desktop use ~1 GB |
| Pi 4 (8 GB) | 8 GB | ~6 GB | Comfortable |
| Pi 5 (4 GB) | 4 GB | ~2.5-3 GB | Faster CPU helps |
| Pi 5 (8 GB) | 8 GB | ~6 GB | Ideal for photo booth |

### Chromium Memory Flags to Consider

```bash
# Limit renderer process memory (helps prevent runaway growth)
--js-flags="--max-old-space-size=512"

# Reduce GPU memory buffer
--gpu-memory-buffer-count-limit=4

# Disable background tab throttling (only one tab in kiosk)
--disable-background-timer-throttling

# Single process (reduces overhead for single-tab kiosk)
# WARNING: less stable, but saves ~100-200 MB
--single-process
```

### When Does Chromium Start Struggling?

| Memory usage | Symptom |
|---|---|
| < 2 GB | Smooth operation |
| 2-3 GB | Fine on 4 GB Pi, watch for spikes |
| 3-4 GB | Starts swapping on 4 GB Pi, jank appears |
| > 4 GB | "Aw, Snap!" crashes on 4 GB Pi |

### Swap and ZRAM Configuration

For long-running kiosk operation, configure ZRAM compressed swap:

```bash
# /etc/default/zramswap
ALLOCATION=2048
PRIORITY=10
```

With ZRAM, Chromium on a 4 GB Pi can effectively use up to ~6-7 GB of memory before the system becomes unresponsive. This is a safety net, not a license to leak memory.

### Nightly Restart Strategy

Chromium is known to accumulate memory over long sessions. For a kiosk running 8+ hours:

```bash
# Cron job to restart Chromium nightly at 3 AM
0 3 * * * pkill chromium; sleep 2; /path/to/start-kiosk.sh
```

Sources:
- [Chromium eats memory](https://forums.raspberrypi.com/viewtopic.php?t=326222)
- [Pi4 crashes randomly (browser runs out of memory?)](https://forums.raspberrypi.com/viewtopic.php?t=244849)
- [Chromium and RAM memory](https://forums.raspberrypi.com/viewtopic.php?t=384545)
- [Severe memory leak in latest Chromium](https://forums.raspberrypi.com/viewtopic.php?t=296598)
- [Increase usable RAM with ZRAM](https://forums.raspberrypi.com/viewtopic.php?t=327238)
- [Chromium performance with RAM disk cache](https://peppe8o.com/chromium-and-raspberry-pi-4-increase-performances-with-cache-on-ram-disk/)

---

## 7. What to Avoid on Pi

### CSS Features That Are Slow

| Feature | Performance impact | Alternative |
|---|---|---|
| `backdrop-filter: blur()` | **Severe jank** -- causes repaint storms. Even Pi 4 cannot handle it during animations | Use `background: rgba(0, 0, 0, 0.7)` as a solid overlay instead |
| Stacked `box-shadow` (multiple layers) | Moderate impact, repainted on every frame if animated | Use a single subtle shadow or use a pre-rendered shadow image |
| `filter: blur()` on large elements | Expensive per-frame recomputation | Apply blur to a smaller off-screen canvas and composite |
| `clip-path` with complex polygons | Can cause full-layer repaints | Stick to simple shapes (circle, inset, simple polygon) |
| CSS `animation` on layout properties (`width`, `height`, `top`, `left`, `margin`, `padding`) | Triggers layout recalculation every frame | Use `transform: translate()` / `scale()` only |
| Large `border-radius` on big elements | Moderate cost, especially with shadows | Keep radius values reasonable |
| `mix-blend-mode` | Falls back to CPU compositing | Avoid in animated layers |

**Golden rule:** Only animate `transform` and `opacity`. Everything else triggers paint or layout on Pi.

Sources:
- [backdrop-filter blur causing lag on Pi 4 (OctoDash)](https://github.com/UnchartedBull/OctoDash/issues/3035)
- [CSS backdrop-filter performance (shadcn/ui)](https://github.com/shadcn-ui/ui/issues/327)
- [Improve Raspberry Pi Zero JS/CSS animation performance](https://forums.raspberrypi.com/viewtopic.php?t=298219)

### JS Patterns That Cause GC Pressure

| Pattern | Problem | Fix |
|---|---|---|
| Creating objects/arrays every frame in `requestAnimationFrame` | Constant minor GC pauses (1-3 ms each) | Pre-allocate and reuse objects |
| String concatenation in hot loops | Creates intermediate string garbage | Use template literals or pre-sized arrays |
| Spreading large objects `{ ...bigObj, key: val }` | Allocates a new object + copies all properties | Mutate a dedicated working object in performance-critical paths (exception to immutability rule for render loops) |
| `Array.map().filter().reduce()` chains | Each step creates an intermediate array | Use a single `for` loop for hot paths |
| Closures capturing large scopes | Prevents GC of captured variables | Extract inner functions, minimize captured scope |
| Frequent `addEventListener` / `removeEventListener` | GC cannot collect orphaned listeners | Use event delegation or a single persistent listener |

**V8 GC on Pi:** Major GC pauses can reach 10-50 ms on Pi 4 (vs 2-5 ms on a desktop). A 50 ms pause at the wrong time drops 3 frames. Minimize allocation in animation loops.

Source: [V8 Blog: Getting garbage collection for free](https://v8.dev/blog/free-garbage-collection)

### Animation Approaches That Drop Frames

| Approach | Problem on Pi | Better approach |
|---|---|---|
| CSS transitions on many elements simultaneously | Compositor overwhelmed | Stagger animations, limit concurrent transitions to 3-4 elements |
| GSAP timeline with 20+ simultaneous tweens | CPU bound, V8 + compositor both strained | Batch into groups, use `will-change` on animated elements only |
| `setInterval` for animation | Not synced to vsync, causes tearing | Use `requestAnimationFrame` exclusively |
| SVG animation (SMIL or CSS) | Very slow rendering on Pi GPU | Replace with canvas or CSS transform animations |
| Lottie (complex After Effects animations) | JSON parsing + canvas rendering per frame | Simplify animations, reduce keyframes, or use CSS alternatives |
| Video backgrounds (looping MP4/WebM) | Consumes decode bandwidth + memory | Use static images or simple CSS gradient animations |
| `will-change` on everything | Promotes too many layers, exhausts GPU memory | Apply only to elements about to animate, remove after |

### General Performance Tips

1. **Reduce DOM size.** Keep the visible DOM under 500 nodes for smooth 60 fps.
2. **Avoid layout thrashing.** Batch reads and writes. Use `requestAnimationFrame` for DOM mutations.
3. **Debounce touch/pointer events.** Pi touchscreen events fire at high frequency.
4. **Use `content-visibility: auto`** on off-screen sections to skip rendering.
5. **Preload assets** during idle states (e.g., while showing the attract screen, preload overlay images for the capture screen).
6. **Test at native resolution.** The official Pi 7" touchscreen is 800x480. Do not assume 1080p.

---

## Summary: Recommended Pi Configuration for DAC Fotobooth

### Minimum Hardware

- **Pi 5 (8 GB)** strongly recommended
- Pi 4 (4 GB) is viable but tight, especially with MediaPipe
- USB webcam (not Pi Camera Module) for browser camera access
- Official 7" touchscreen (800x480) or HDMI display

### Chromium Launch Script

```bash
#!/bin/bash

# Fix crash restore prompt
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' \
  ~/.config/chromium/Default/Preferences 2>/dev/null
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' \
  ~/.config/chromium/Default/Preferences 2>/dev/null

chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --disable-translate \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --disable-features=TouchpadOverscrollHistoryNavigation \
  --enable-features=OverlayScrollbar \
  --check-for-update-interval=31536000 \
  --autoplay-policy=no-user-gesture-required \
  --ignore-gpu-blocklist \
  --enable-gpu-rasterization \
  --enable-zero-copy \
  --disable-background-timer-throttling \
  --js-flags="--max-old-space-size=512" \
  https://localhost:3000
```

### Feature Tier Strategy

```js
const pi = detectRaspberryPi();

const featureTier =
  !pi.isPi ? 'full' :                         // Desktop/laptop
  pi.memoryGB >= 8 ? 'pi-high' :              // Pi 5 8GB
  pi.memoryGB >= 4 ? 'pi-standard' :          // Pi 4/5 4GB
  'pi-lite';                                   // Pi 4 1-2GB

const config = {
  full: {
    captureRes: { width: 1920, height: 1080 },
    canvasSize: { width: 1920, height: 1080 },
    enableMediaPipe: true,
    enableBlur: true,
    animationBudget: 'unlimited',
  },
  'pi-high': {
    captureRes: { width: 1280, height: 720 },
    canvasSize: { width: 1280, height: 720 },
    enableMediaPipe: true,
    enableBlur: false,
    animationBudget: 'moderate',
  },
  'pi-standard': {
    captureRes: { width: 1280, height: 720 },
    canvasSize: { width: 1280, height: 720 },
    enableMediaPipe: false,     // Too slow on 4GB Pi 4
    enableBlur: false,
    animationBudget: 'minimal',
  },
  'pi-lite': {
    captureRes: { width: 640, height: 480 },
    canvasSize: { width: 640, height: 480 },
    enableMediaPipe: false,
    enableBlur: false,
    animationBudget: 'minimal',
  },
};
```
