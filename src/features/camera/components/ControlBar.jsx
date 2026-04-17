"use client"

import { useState, useCallback } from "react"
import {
  FullscreenIcon,
  DownloadIcon,
  GridIcon,
  MascotIcon,
  LayoutIcon,
  CameraSwitchIcon,
  SettingsIcon,
  WifiOffIcon,
  StripIcon,
} from "@/components/ui/icons"
import { ControlBarItem, ControlBarTooltip } from "@/components/ui/ControlBarItem"
import { BUTTON_STYLES } from "@/lib/styles/buttons"
import { useCameraStore } from "@/features/camera/store"
import { useUiStore } from "@/stores/uiStore"
import { useGalleryStore } from "@/features/gallery/store"
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
          <div className={`${BUTTON_STYLES.icon} border-[#e6c189]`} aria-label="Offline">
            <WifiOffIcon className="w-5 h-5 text-[#e6c189]" />
          </div>
          <ControlBarTooltip label="Geen verbinding" className="text-[#e6c189]" />
        </div>
      )}

      <ControlBarItem
        onClick={() => openModal("gallery")}
        icon={<GridIcon className="w-5 h-5 text-white/60" />}
        label="Gallerij openen"
        className="relative"
      >
        {galleryCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-none bg-[#e6c189] text-black text-[0.625rem] flex items-center justify-center font-bold pointer-events-none font-mono">
            {galleryCount}
          </span>
        )}
      </ControlBarItem>

      <ControlBarItem
        onClick={() => openModal("mascotPicker")}
        icon={<MascotIcon className="w-5 h-5 text-white/60" />}
        label="Mascotte kiezen"
      />

      <ControlBarItem
        onClick={() => openModal("layoutSlider")}
        icon={<LayoutIcon className="w-5 h-5 text-white/60" />}
        label="Layout kiezen"
      />

      <ControlBarItem
        onClick={toggleStripMode}
        icon={
          <StripIcon
            className={`w-5 h-5 ${stripModeEnabled ? "text-[#e6c189]" : "text-white/60"}`}
          />
        }
        label={stripModeEnabled ? "Strip mode uit" : "Strip mode aan"}
        className={stripModeEnabled ? "border-[#e6c189] bg-[#1a1a1a]" : ""}
      />

      {devices.length > 0 && (
        <div className="relative">
          <ControlBarItem
            onClick={toggleCameraMenu}
            icon={<CameraSwitchIcon className="w-6 h-6 text-white/60" />}
            label="Camera wisselen"
          />

          <div
            className={`absolute right-14 top-0 max-lg:landscape:right-auto max-lg:landscape:left-0 max-lg:landscape:top-auto max-lg:landscape:bottom-14 min-w-48 rounded-none bg-black border border-white/20 overflow-hidden transition-all duration-200 origin-right max-lg:landscape:origin-bottom ${
              cameraMenuOpen
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-95 pointer-events-none"
            }`}
          >
            {devices.map((device) => (
              <button
                key={device.deviceId}
                onClick={() => {
                  switchCamera?.(device.deviceId)
                  setCameraMenuOpen(false)
                }}
                className={`w-full px-4 py-3 text-left text-sm transition-colors cursor-pointer border-b border-white/10 last:border-b-0 ${
                  device.deviceId === selectedDeviceId
                    ? "bg-[#1a1a1a] text-white font-medium"
                    : "text-white/60 hover:bg-[#111]"
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
          icon={<DownloadIcon className="w-5 h-5 text-white/60" />}
          label="App installeren"
        />
      )}

      <div className="hidden md:block">
        <ControlBarItem
          onClick={toggleFullscreen}
          icon={<FullscreenIcon className="w-5 h-5 text-white/60" />}
          label="Fullscreen"
        />
      </div>

      <ControlBarItem
        onClick={() => openModal("settings")}
        icon={<SettingsIcon className="w-5 h-5 text-white/60" />}
        label="Instellingen"
      />
    </div>
  )
}
