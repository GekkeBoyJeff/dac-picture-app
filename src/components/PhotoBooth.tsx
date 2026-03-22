"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useGallery } from "@/hooks/useGallery";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useToast } from "@/hooks/useToast";
import { useHandGesture } from "@/hooks/useHandGesture";
import { compositePhoto } from "@/lib/compositePhoto";
import { sendToDiscord } from "@/lib/sendToDiscord";
import { COUNTDOWN_SECONDS, LOOK_UP_PROMPT_ENABLED } from "@/lib/config";
import { CameraView } from "./camera";
import { WarningIcon } from "./icons";
import { Countdown } from "./Countdown";
import { FlashEffect } from "./FlashEffect";
import { Gallery } from "./Gallery";
import { InstallBanner } from "./InstallBanner";

type AppState = "camera" | "countdown" | "capturing" | "sending";

export function PhotoBooth() {
  const [appState, setAppState] = useState<AppState>("camera");
  const [showFlash, setShowFlash] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showAppQr, setShowAppQr] = useState(false);
  const appQrTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
  const { photos, addPhoto, removePhoto } = useGallery();
  const { canInstall, promptInstall, showBanner, isIOS, dismissBanner } = useInstallPrompt();
  const toast = useToast();

  const handlePeaceSign = useCallback(() => {
    if (appState === "camera" && isReady) {
      setAppState("countdown");
    }
  }, [appState, isReady]);

  const handleFist = useCallback(() => {
    if (appQrTimerRef.current) clearTimeout(appQrTimerRef.current);
    setShowAppQr(true);
    appQrTimerRef.current = setTimeout(() => setShowAppQr(false), 5000);
  }, []);

  const gestureCallbacks = useMemo(() => ({
    onVictory: handlePeaceSign,
    onClosedFist: handleFist,
  }), [handlePeaceSign, handleFist]);

  const { activeGesture } = useHandGesture(
    videoRef,
    appState === "camera" && isReady,
    gestureCallbacks
  );

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  const handleCapture = useCallback(() => {
    if (!isReady) return;
    if (appState === "countdown") {
      setAppState("camera");
      return;
    }
    if (appState !== "camera") return;
    setAppState("countdown");
  }, [appState, isReady]);

  const handleCountdownComplete = useCallback(async () => {
    setAppState("capturing");
    setShowFlash(true);

    try {
      const video = videoRef.current;
      if (!video) throw new Error("Video element not available");

      const container = containerRef.current;
      if (!container) throw new Error("Container element not available");

      const { exportDataUrl, galleryDataUrl } = await compositePhoto(
        video,
        container,
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
      <div className="w-dvw h-dvh bg-black flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <WarningIcon className="w-10 h-10 text-red-400" />
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
        containerRef={containerRef}
        onCapture={handleCapture}
        onGalleryToggle={() => setShowGallery(true)}
        galleryCount={photos.length}
        disabled={appState !== "camera" && appState !== "countdown"}
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onSwitchCamera={switchCamera}
        isMirrored={isMirrored}
        canInstall={canInstall}
        onInstall={promptInstall}
        activeGesture={activeGesture}
        showAppQr={showAppQr}
        onCloseAppQr={() => setShowAppQr(false)}
      />

      {appState === "countdown" && (
        <Countdown
          seconds={COUNTDOWN_SECONDS}
          onComplete={handleCountdownComplete}
          showLookUp={LOOK_UP_PROMPT_ENABLED}
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
        onRemove={removePhoto}
      />

      {showBanner && (
        <InstallBanner
          isIOS={isIOS}
          onInstall={promptInstall}
          onDismiss={dismissBanner}
        />
      )}
    </>
  );
}
