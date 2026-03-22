"use client";

import { memo, RefObject, useState } from "react";
import { OVERLAYS, CORNERS, CORNER_SIZE, CORNER_OFFSET, QR_CODE } from "@/lib/config";
import { getOverlayStyle, getOverlayClassName } from "@/lib/overlayStyles";
import type { CameraDevice } from "@/hooks/useCamera";
import type { ActiveGesture } from "@/hooks/useHandGesture";

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  onCapture: () => void;
  onGalleryToggle: () => void;
  galleryCount: number;
  disabled: boolean;
  devices: CameraDevice[];
  selectedDeviceId: string | null;
  onSwitchCamera: (deviceId: string) => void;
  isMirrored: boolean;
  canInstall: boolean;
  onInstall: () => void;
  activeGesture: ActiveGesture;
  showAppQr: boolean;
  onCloseAppQr: () => void;
}

export const CameraView = memo(function CameraView({
  videoRef,
  onCapture,
  onGalleryToggle,
  galleryCount,
  disabled,
  devices,
  selectedDeviceId,
  onSwitchCamera,
  isMirrored,
  canInstall,
  onInstall,
  activeGesture,
  showAppQr,
  onCloseAppQr,
}: CameraViewProps) {
  const [showCameraMenu, setShowCameraMenu] = useState(false);

  return (
    <main className="flex items-center justify-center w-screen h-screen bg-black">
      <div
        className="relative overflow-hidden max-h-screen landscape:aspect-video landscape:h-screen landscape:w-auto portrait:aspect-9/16 portrait:w-screen portrait:h-auto"
      >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${isMirrored ? "-scale-x-100" : ""}`}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)",
        }}
      />

      <div className="absolute bottom-0 left-0 right-0 h-[45%] pointer-events-none bg-linear-to-t from-black/50 via-black/20 to-transparent" />

      <div className="absolute top-0 left-0 right-0 h-[20%] pointer-events-none bg-linear-to-b from-black/40 to-transparent" />

      {CORNERS.map((corner) => {
        const style: React.CSSProperties = { width: CORNER_SIZE, height: CORNER_SIZE };
        if (corner.position.includes("top")) style.top = CORNER_OFFSET;
        if (corner.position.includes("bottom")) style.bottom = CORNER_OFFSET;
        if (corner.position.includes("left")) style.left = CORNER_OFFSET;
        if (corner.position.includes("right")) style.right = CORNER_OFFSET;
        return <img key={corner.src} src={corner.src} alt="" draggable={false} className="absolute pointer-events-none" style={style} />;
      })}

      {OVERLAYS.map((config) => (
        <img
          key={config.path}
          src={config.path}
          alt=""
          style={getOverlayStyle(config)}
          className={getOverlayClassName(config)}
          draggable={false}
        />
      ))}

      <div
        className="absolute flex items-center gap-3 pointer-events-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
        style={{ top: 30, left: 100 }}
      >
        <span className="text-white/90 text-2xl font-semibold tracking-[0.15em] uppercase leading-tight">
          Dutch Anime<br />Community
        </span>
      </div>

      <img
        src={QR_CODE.src}
        alt=""
        draggable={false}
        className="absolute pointer-events-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
        style={{ top: QR_CODE.top, left: QR_CODE.left, width: QR_CODE.size, height: QR_CODE.size, opacity: QR_CODE.opacity }}
      />

      <span
        className="absolute text-white/70 text-xs font-mono pointer-events-none z-10 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] left-1/2 -translate-x-1/2"
        style={{ bottom: "3.2%" }}
      >
        {new Date().toLocaleDateString("nl-NL", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </span>

      {activeGesture === "Victory" && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 animate-pulse">
          <span className="text-2xl">✌️</span>
          <span className="text-white text-sm font-medium">Houd vast...</span>
        </div>
      )}
      {activeGesture === "Closed_Fist" && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 animate-pulse">
          <span className="text-2xl">✊</span>
          <span className="text-white text-sm font-medium">Houd vast...</span>
        </div>
      )}

      <button
        onClick={onCapture}
        disabled={disabled}
        className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 cursor-pointer disabled:cursor-not-allowed group"
        aria-label="Maak foto"
      >
        <div
          className={`w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/50 flex items-center justify-center transition-all hover:bg-white/20 hover:scale-105 active:scale-95 ${
            !disabled ? "animate-shutter-pulse" : "opacity-40"
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-white group-hover:bg-white/90 transition-colors" />
        </div>
      </button>

      {devices.length > 1 && (
        <div className="absolute bottom-12 right-6 z-10">
          <button
            onClick={() => setShowCameraMenu((v) => !v)}
            className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Wissel camera"
          >
            <svg
              className="w-5 h-5 text-white/70"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183"
              />
            </svg>
          </button>

          {showCameraMenu && (
            <div className="absolute bottom-12 right-0 min-w-56 rounded-xl bg-gray-950/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
              {devices.map((device) => (
                <button
                  key={device.deviceId}
                  onClick={() => {
                    onSwitchCamera(device.deviceId);
                    setShowCameraMenu(false);
                  }}
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
          )}
        </div>
      )}

      <div className="absolute top-5 right-17 z-10">
        <button
          onClick={() => onCloseAppQr()}
          className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
          aria-label="Open op telefoon"
        >
          <svg
            className="w-5 h-5 text-white/70"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
            />
          </svg>
        </button>
      </div>

      {showAppQr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => onCloseAppQr()}
        >
          <div
            className="bg-gray-950/95 border border-white/10 rounded-2xl p-6 shadow-2xl max-w-xs w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white text-center font-semibold mb-1">Open op je telefoon</p>
            <p className="text-white/50 text-xs text-center mb-4">Scan de QR code met je camera</p>
            <img
              src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/overlays/qr-app.svg`}
              alt="QR code naar app"
              className="w-full aspect-square"
            />
            <button
              onClick={() => onCloseAppQr()}
              className="mt-2 w-full py-2 rounded-lg bg-white/10 text-white/70 text-sm hover:bg-white/20 transition-colors cursor-pointer"
            >
              Sluiten
            </button>
          </div>
        </div>
      )}

      {canInstall && (
        <button
          onClick={onInstall}
          className="absolute top-5 right-29 w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer z-10"
          aria-label="Installeer app"
        >
          <svg
            className="w-5 h-5 text-white/70"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
        </button>
      )}

      <button
        onClick={onGalleryToggle}
        className="absolute top-5 right-5 w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer z-10"
        aria-label="Galerij"
      >
        <svg
          className="w-5 h-5 text-white/70"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
          />
        </svg>
        {galleryCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white/30 backdrop-blur-sm text-white text-[10px] flex items-center justify-center font-medium">
            {galleryCount}
          </span>
        )}
      </button>
      </div>
    </main>
  );
});
