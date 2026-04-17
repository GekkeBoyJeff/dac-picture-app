/**
 * Web Audio API sound effects for countdown and shutter.
 * No audio files needed — all sounds are synthesized.
 */

let audioCtx = null

function getContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

/**
 * Play a sine-wave beep.
 * @param {number} frequency - Hz
 * @param {number} duration - seconds
 * @param {number} volume - gain 0-1
 */
function playBeep(frequency, duration, volume) {
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

/**
 * Countdown beep — 660 Hz tick or 1200 Hz final.
 * @param {boolean} isFinal - true for the last count
 */
export function playCountdownBeep(isFinal) {
  if (isFinal) {
    playBeep(1200, 0.15, 0.35)
  } else {
    playBeep(660, 0.08, 0.2)
  }
}

// Legacy aliases for old components
export const playCountdownTick = () => playCountdownBeep(false)
export const playCountdownFinal = () => playCountdownBeep(true)
export const playShutter = playShutterSound

/**
 * Camera shutter sound — shaped white noise burst through a highpass filter.
 */
export function playShutterSound() {
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