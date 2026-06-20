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
  RemoteIcon,
} from "@/components/ui/icons"
import { ControlBarItem, ControlBarTooltip } from "@/components/ui/ControlBarItem"
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

export function ControlBar({ canInstall, onInstall, switchCamera, onRemote }) {
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
    <div className="pointer-events-auto absolute right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2.5 max-lg:landscape:bottom-3 max-lg:landscape:left-1/2 max-lg:landscape:right-auto max-lg:landscape:top-auto max-lg:landscape:-translate-x-1/2 max-lg:landscape:translate-y-0 max-lg:landscape:flex-row">
      {!isOnline && (
        <div className="group relative">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-warning/40 bg-warning/12 backdrop-blur-md"
            aria-label="Offline"
          >
            <WifiOffIcon className="h-5 w-5 text-warning" />
          </div>
          <ControlBarTooltip label="Geen verbinding" className="text-warning" />
        </div>
      )}

      <ControlBarItem
        onClick={() => openModal("gallery")}
        icon={<GridIcon className="h-5 w-5" />}
        label="Gallerij openen"
      >
        {galleryCount > 0 && (
          <span className="pointer-events-none absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[0.625rem] font-bold text-[#1b1407]">
            {galleryCount}
          </span>
        )}
      </ControlBarItem>

      <ControlBarItem
        onClick={() => openModal("mascotPicker")}
        icon={<MascotIcon className="h-5 w-5" />}
        label="Mascotte kiezen"
      />

      <ControlBarItem
        onClick={() => openModal("layoutSlider")}
        icon={<LayoutIcon className="h-5 w-5" />}
        label="Layout kiezen"
      />

      <ControlBarItem
        onClick={toggleStripMode}
        active={stripModeEnabled}
        icon={<StripIcon className="h-5 w-5" />}
        label={stripModeEnabled ? "Strip mode uit" : "Strip mode aan"}
      />

      {devices.length > 0 && (
        <div className="relative">
          <ControlBarItem
            onClick={toggleCameraMenu}
            icon={<CameraSwitchIcon className="h-6 w-6" />}
            label="Camera wisselen"
          />

          <div
            className={`absolute right-14 top-0 min-w-48 origin-right overflow-hidden rounded-2xl border border-hairline bg-raised shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-200 max-lg:landscape:bottom-14 max-lg:landscape:left-0 max-lg:landscape:right-auto max-lg:landscape:top-auto max-lg:landscape:origin-bottom ${
              cameraMenuOpen
                ? "scale-100 opacity-100 pointer-events-auto"
                : "scale-95 opacity-0 pointer-events-none"
            }`}
          >
            {devices.map((device) => (
              <button
                key={device.deviceId}
                onClick={() => {
                  switchCamera?.(device.deviceId)
                  setCameraMenuOpen(false)
                }}
                className={`w-full cursor-pointer px-4 py-3 text-left text-sm transition-colors ${
                  device.deviceId === selectedDeviceId
                    ? "bg-gold/15 font-medium text-gold-strong"
                    : "text-ink-muted hover:bg-surface hover:text-ink"
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
          icon={<DownloadIcon className="h-5 w-5" />}
          label="App installeren"
        />
      )}

      <div className="hidden md:block">
        <ControlBarItem
          onClick={toggleFullscreen}
          icon={<FullscreenIcon className="h-5 w-5" />}
          label="Fullscreen"
        />
      </div>

      <ControlBarItem
        onClick={onRemote}
        icon={<RemoteIcon className="h-5 w-5" />}
        label="Remote panel"
      />

      <ControlBarItem
        onClick={() => openModal("settings")}
        icon={<SettingsIcon className="h-5 w-5" />}
        label="Instellingen"
      />
    </div>
  )
}