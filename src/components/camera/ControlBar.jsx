"use client"

import { useState, useCallback } from "react"
import { FullscreenIcon, DownloadIcon, GridIcon, MascotIcon, LayoutIcon, CameraSwitchIcon, SettingsIcon } from "../icons"
import { BUTTON_STYLES } from "@/lib/styles/buttons"
import { useCameraContext, useUIContext, useModalContext } from "@/context"

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen().catch(() => {})
  }
}

export function ControlBar() {
  const { devices, selectedDeviceId, switchCamera } = useCameraContext()
  const { openGallery, galleryCount, canInstall, onInstall } = useUIContext()
  const {
    openMascotPicker,
    openLayoutPicker,
    openSettings,
  } = useModalContext()

  const [cameraMenuOpen, setCameraMenuOpen] = useState(false)

  const toggleCameraMenu = useCallback(() => setCameraMenuOpen((v) => !v), [])

  const selectCamera = useCallback((deviceId) => {
    switchCamera(deviceId)
    setCameraMenuOpen(false)
  }, [switchCamera])

  return (
    <div className="pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 max-lg:landscape:right-auto max-lg:landscape:top-auto max-lg:landscape:translate-y-0 max-lg:landscape:bottom-3 max-lg:landscape:left-1/2 max-lg:landscape:-translate-x-1/2 max-lg:landscape:flex-row z-10">
      <div className="relative group">
        <button onClick={openGallery} className={`relative ${BUTTON_STYLES.icon}`} aria-label="Gallery">
          <GridIcon className="w-5 h-5 text-white/70" />
          {galleryCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white/30 backdrop-blur-sm text-white text-[10px] flex items-center justify-center font-medium">
              {galleryCount}
            </span>
          )}
        </button>
        <span className="pointer-events-none absolute -left-[9.5rem] top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1 rounded-lg bg-black/80 border border-white/10 text-white/70 text-xs opacity-0 translate-x-2 transition duration-150 group-hover:opacity-100 group-hover:translate-x-0 max-lg:hidden">
          Gallerij openen
        </span>
      </div>

      <div className="relative group">
        <button onClick={openMascotPicker} className={BUTTON_STYLES.icon} aria-label="Choose mascot">
          <MascotIcon className="w-5 h-5 text-white/70" />
        </button>
        <span className="pointer-events-none absolute -left-[9.5rem] top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1 rounded-lg bg-black/80 border border-white/10 text-white/70 text-xs opacity-0 translate-x-2 transition duration-150 group-hover:opacity-100 group-hover:translate-x-0 max-lg:hidden">
          Mascotte kiezen
        </span>
      </div>

      <div className="relative group">
        <button onClick={openLayoutPicker} className={BUTTON_STYLES.icon} aria-label="Choose layout">
          <LayoutIcon className="w-5 h-5 text-white/70" />
        </button>
        <span className="pointer-events-none absolute -left-[9.5rem] top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1 rounded-lg bg-black/80 border border-white/10 text-white/70 text-xs opacity-0 translate-x-2 transition duration-150 group-hover:opacity-100 group-hover:translate-x-0 max-lg:hidden">
          Layout kiezen
        </span>
      </div>

      {devices.length > 0 && (
        <div className="relative">
          <div className="relative group">
            <button
              onClick={toggleCameraMenu}
              className={BUTTON_STYLES.icon}
              aria-label="Camera wisselen"
            >
              <CameraSwitchIcon className="w-6 h-6 text-white/70" />
            </button>
            <span className="pointer-events-none absolute -left-[10.5rem] top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1 rounded-lg bg-black/80 border border-white/10 text-white/70 text-xs opacity-0 translate-x-2 transition duration-150 group-hover:opacity-100 group-hover:translate-x-0 max-lg:hidden">
              Camera wisselen
            </span>
          </div>

          <div
            className={`absolute right-12 top-0 max-lg:landscape:right-auto max-lg:landscape:left-0 max-lg:landscape:top-auto max-lg:landscape:bottom-12 min-w-48 rounded-xl bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-200 origin-right max-lg:landscape:origin-bottom ${
              cameraMenuOpen
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-95 pointer-events-none"
            }`}
          >
            {devices.map((device) => (
              <button
                key={device.deviceId}
                onClick={() => selectCamera(device.deviceId)}
                className={`w-full px-4 py-3 text-left text-sm transition-colors cursor-pointer ${
                  device.deviceId === selectedDeviceId
                    ? "bg-white/15 text-white font-medium"
                    : "text-white/70 hover:bg-white/10"
                }`}
              >
                {device.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {canInstall && (
        <div className="relative group">
          <button onClick={onInstall} className={BUTTON_STYLES.icon} aria-label="Install app">
            <DownloadIcon className="w-5 h-5 text-white/70" />
          </button>
          <span className="pointer-events-none absolute -left-[9.5rem] top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1 rounded-lg bg-black/80 border border-white/10 text-white/70 text-xs opacity-0 translate-x-2 transition duration-150 group-hover:opacity-100 group-hover:translate-x-0 max-lg:hidden">
            App installeren
          </span>
        </div>
      )}

      <div className="relative group hidden md:block">
        <button
          onClick={toggleFullscreen}
          className={`${BUTTON_STYLES.icon} hidden md:flex`}
          aria-label="Fullscreen"
        >
          <FullscreenIcon className="w-5 h-5 text-white/70" />
        </button>
        <span className="pointer-events-none absolute -left-[9.5rem] top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1 rounded-lg bg-black/80 border border-white/10 text-white/70 text-xs opacity-0 translate-x-2 transition duration-150 group-hover:opacity-100 group-hover:translate-x-0">
          Fullscreen
        </span>
      </div>

      <div className="relative group">
        <button onClick={openSettings} className={BUTTON_STYLES.icon} aria-label="Instellingen">
          <SettingsIcon className="w-5 h-5 text-white/70" />
        </button>
        <span className="pointer-events-none absolute -left-[9.5rem] top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1 rounded-lg bg-black/80 border border-white/10 text-white/70 text-xs opacity-0 translate-x-2 transition duration-150 group-hover:opacity-100 group-hover:translate-x-0 max-lg:hidden">
          Instellingen
        </span>
      </div>
    </div>
  )
}