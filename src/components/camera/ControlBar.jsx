"use client"

import { useState, useCallback } from "react"
import { FullscreenIcon, DownloadIcon, GridIcon, MascotIcon, LayoutIcon, CameraSwitchIcon, SettingsIcon, WifiOffIcon, StripIcon } from "@/components/ui/icons"
import { ControlBarItem, ControlBarTooltip } from "@/components/ui/ControlBarItem"
import { BUTTON_STYLES } from "@/lib/styles/buttons"
import { useCameraStore } from "@/stores/cameraStore"
import { useUiStore } from "@/stores/uiStore"
import { useGalleryStore } from "@/stores/galleryStore"
import { useOnlineStatus } from "@/hooks/useOnlineStatus"

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen().catch(() => {})
  }
}

export function ControlBar({ canInstall, onInstall, switchCamera }) {
  const devices = useCameraStore((s) => s.devices)
  const selectedDeviceId = useCameraStore((s) => s.selectedDeviceId)
  const openModal = useUiStore((s) => s.openModal)
  const stripModeEnabled = useUiStore((s) => s.stripModeEnabled)
  const toggleStripMode = useUiStore((s) => s.toggleStripMode)
  const galleryCount = useGalleryStore((s) => s.photos.length)

  const isOnline = useOnlineStatus()
  const [cameraMenuOpen, setCameraMenuOpen] = useState(false)

  const toggleCameraMenu = useCallback(() => setCameraMenuOpen((v) => !v), [])

  return (
    <div className="pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 max-lg:landscape:right-auto max-lg:landscape:top-auto max-lg:landscape:translate-y-0 max-lg:landscape:bottom-3 max-lg:landscape:left-1/2 max-lg:landscape:-translate-x-1/2 max-lg:landscape:flex-row z-10">
      {!isOnline && (
        <div className="relative group">
          <div className={`${BUTTON_STYLES.icon} border-amber-400/40 bg-amber-400/10`} aria-label="Offline">
            <WifiOffIcon className="w-5 h-5 text-amber-400/80" />
          </div>
          <ControlBarTooltip label="Geen verbinding" className="text-amber-400/80" />
        </div>
      )}

      <ControlBarItem
        onClick={() => openModal("gallery")}
        icon={<GridIcon className="w-5 h-5 text-white/70" />}
        label="Gallerij openen"
        className="relative"
      >
        {galleryCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white/30 backdrop-blur-sm text-white text-[0.625rem] flex items-center justify-center font-medium pointer-events-none">
            {galleryCount}
          </span>
        )}
      </ControlBarItem>

      <ControlBarItem
        onClick={() => openModal("mascotPicker")}
        icon={<MascotIcon className="w-5 h-5 text-white/70" />}
        label="Mascotte kiezen"
      />

      <ControlBarItem
        onClick={() => openModal("layoutSlider")}
        icon={<LayoutIcon className="w-5 h-5 text-white/70" />}
        label="Layout kiezen"
      />

      <ControlBarItem
        onClick={toggleStripMode}
        icon={<StripIcon className={`w-5 h-5 ${stripModeEnabled ? "text-violet-400" : "text-white/70"}`} />}
        label={stripModeEnabled ? "Strip mode uit" : "Strip mode aan"}
        className={stripModeEnabled ? "border-violet-400/50 bg-violet-400/15 shadow-[0_0_0_1px_rgba(139,92,246,0.25)]" : ""}
      />

      {devices.length > 0 && (
        <div className="relative">
          <ControlBarItem
            onClick={toggleCameraMenu}
            icon={<CameraSwitchIcon className="w-6 h-6 text-white/70" />}
            label="Camera wisselen"
          />

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
                onClick={() => { switchCamera?.(device.deviceId); setCameraMenuOpen(false) }}
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
        <ControlBarItem
          onClick={onInstall}
          icon={<DownloadIcon className="w-5 h-5 text-white/70" />}
          label="App installeren"
        />
      )}

      <div className="hidden md:block">
        <ControlBarItem
          onClick={toggleFullscreen}
          icon={<FullscreenIcon className="w-5 h-5 text-white/70" />}
          label="Fullscreen"
        />
      </div>

      <ControlBarItem
        onClick={() => openModal("settings")}
        icon={<SettingsIcon className="w-5 h-5 text-white/70" />}
        label="Instellingen"
      />
    </div>
  )
}
