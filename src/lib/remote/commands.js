import { scenePresets } from "@/components/drawers/settings/settingsPresets"
import { useGalleryStore } from "@/stores/galleryStore"

// cmd MUST be the output of validateCommand (trusted shape + clamped values).
export function applyCommand(state, cmd) {
  switch (cmd.t) {
    case "trigger":
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("remote:trigger"))
      return
    case "toggle": {
      const fns = {
        stripModeEnabled: state.toggleStripMode,
        flashEnabled: state.toggleFlash,
        gesturesEnabled: state.toggleGestures,
        debugEnabled: state.toggleDebug,
        forceLowPower: state.toggleForceLowPower,
      }
      fns[cmd.key]?.()
      return
    }
    case "set": {
      const fns = {
        numHands: state.setNumHands,
        minDetectionConfidence: state.setMinDetectionConfidence,
        minPresenceConfidence: state.setMinPresenceConfidence,
        minTrackingConfidence: state.setMinTrackingConfidence,
        triggerMinScore: state.setTriggerScore,
      }
      fns[cmd.key]?.(cmd.value)
      return
    }
    case "preset:scene": {
      const preset = scenePresets.find((p) => p.id === cmd.id)
      if (preset) state.applyScenePreset(preset)
      return
    }
    case "preset:gesture":
      state.setDetectionInterval(cmd.interval)
      state.setTriggerScore(cmd.score)
      return
    case "preset:hold":
      state.setGestureHold(cmd.ms)
      return
    case "preset:highPower":
      state.applyHighPowerPreset()
      return
    case "preset:lowPower":
      state.applyLowPowerPreset()
      return
    case "gallery:open":
      state.openModal("gallery")
      state.openGalleryLightbox(0)
      return
    case "gallery:next":
      state.galleryNext(useGalleryStore.getState().photos.length)
      return
    case "gallery:prev":
      state.galleryPrev()
      return
    case "gallery:close":
      state.closeGalleryLightbox()
      state.closeModal("gallery")
      return
  }
}