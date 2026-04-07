let audioCtx = null

function getContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

/**
 * Play a short beep using the Web Audio API (no files needed).
 * @param {number} frequency - Hz
 * @param {number} duration - seconds
 * @param {number} [volume=0.3] - gain 0-1
 */
export function playBeep(frequency = 880, duration = 0.1, volume = 0.3) {
  try {
    const ctx = getContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    osc.frequency.value = frequency
    gain.gain.value = volume

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.stop(ctx.currentTime + duration)
  } catch {
    // Audio not supported — silently ignore
  }
}

/** Short countdown tick */
export function playCountdownTick() {
  playBeep(660, 0.08, 0.2)
}

/** Final countdown beep (higher pitch) */
export function playCountdownFinal() {
  playBeep(1200, 0.15, 0.35)
}

/** Camera shutter sound */
export function playShutter() {
  try {
    const ctx = getContext()
    const bufferSize = ctx.sampleRate * 0.06
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3)
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer

    const gain = ctx.createGain()
    gain.gain.value = 0.15

    const filter = ctx.createBiquadFilter()
    filter.type = "highpass"
    filter.frequency.value = 2000

    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    source.start(ctx.currentTime)
  } catch {
    // Audio not supported — silently ignore
  }
}