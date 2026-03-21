"use client";

import { useState, useEffect, useCallback } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useGallery } from "@/hooks/useGallery";
import { useToast } from "@/hooks/useToast";
import { compositePhoto } from "@/lib/compositePhoto";
import { sendToDiscord } from "@/lib/sendToDiscord";
import { OVERLAYS, getTextOverlays, COUNTDOWN_SECONDS } from "@/lib/config";
import { CameraView } from "./CameraView";
import { Countdown } from "./Countdown";
import { FlashEffect } from "./FlashEffect";
import { Gallery } from "./Gallery";

type AppState = "camera" | "countdown" | "capturing" | "sending";

export function PhotoBooth() {
  const [appState, setAppState] = useState<AppState>("camera");
  const [showFlash, setShowFlash] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const {
    videoRef,
    isReady,
    error,
    devices,
    selectedDeviceId,
    isMirrored,
    startCamera,
    switchCamera,
  } = useCamera();
  const { photos, addPhoto } = useGallery();
  const toast = useToast();

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  const handleCapture = useCallback(() => {
    if (appState !== "camera" || !isReady) return;
    setAppState("countdown");
  }, [appState, isReady]);

  const handleCountdownComplete = useCallback(async () => {
    setAppState("capturing");
    setShowFlash(true);

    try {
      const video = videoRef.current;
      if (!video) throw new Error("Video element not available");

      const { exportDataUrl, galleryDataUrl } = await compositePhoto(
        video,
        OVERLAYS,
        getTextOverlays(),
        isMirrored
      );

      addPhoto(galleryDataUrl);
      setAppState("sending");

      const success = await sendToDiscord(exportDataUrl);
      toast.show(success ? "Verzonden!" : "Verzenden naar Discord mislukt");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Er ging iets mis";
      toast.show(message);
    } finally {
      setTimeout(() => setAppState("camera"), 1500);
    }
  }, [videoRef, addPhoto, toast, isMirrored]);

  if (error) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <p className="text-white/80 text-lg mb-4">{error}</p>
          <button
            onClick={() => startCamera()}
            className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <CameraView
        videoRef={videoRef}
        onCapture={handleCapture}
        onGalleryToggle={() => setShowGallery(true)}
        galleryCount={photos.length}
        disabled={appState !== "camera"}
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onSwitchCamera={switchCamera}
        isMirrored={isMirrored}
      />

      {appState === "countdown" && (
        <Countdown
          seconds={COUNTDOWN_SECONDS}
          onComplete={handleCountdownComplete}
        />
      )}

      {showFlash && <FlashEffect onComplete={() => setShowFlash(false)} />}

      {toast.message && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 text-white text-sm font-medium animate-fade-in">
          {toast.message}
        </div>
      )}

      <Gallery
        photos={photos}
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
      />
    </>
  );
}
