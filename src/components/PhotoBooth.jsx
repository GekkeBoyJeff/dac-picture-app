"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useGallery } from "@/hooks/useGallery";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useToast } from "@/hooks/useToast";
import { useHandGesture } from "@/hooks/useHandGesture";
import { useOverlaySettings } from "@/hooks/useOverlaySettings";
import { compositePhoto } from "@/lib/compositePhoto";
import { sendToDiscord } from "@/lib/sendToDiscord";
import { COUNTDOWN_SECONDS, LOOK_UP_PROMPT_ENABLED } from "@/lib/config";
import { CameraView } from "./camera";
import { BoothProvider } from "./BoothContext";
import { WarningIcon } from "./icons";
import { Countdown } from "./Countdown";
import { FlashEffect } from "./FlashEffect";
import { Gallery } from "./Gallery";
import { InstallBanner } from "./InstallBanner";

export function PhotoBooth() {
  const [appState, setAppState] = useState("camera");
  const [showFlash, setShowFlash] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showMascotPicker, setShowMascotPicker] = useState(false);
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const containerRef = useRef(null);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const {
    videoRef,
    isReady,
    isRecalibrating,
    isSwitching,
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
  const { layout, mascot, activeConvention, setLayoutId, setMascotId } = useOverlaySettings();

  const openGallery = useCallback(() => setShowGallery(true), []);
  const closeGallery = useCallback(() => setShowGallery(false), []);
  const openMascotPicker = useCallback(() => setShowMascotPicker(true), []);
  const closeMascotPicker = useCallback(() => setShowMascotPicker(false), []);
  const openLayoutPicker = useCallback(() => setShowLayoutPicker(true), []);
  const closeLayoutPicker = useCallback(() => setShowLayoutPicker(false), []);
  const openAbout = useCallback(() => setShowAbout(true), []);
  const closeAbout = useCallback(() => setShowAbout(false), []);
  const clearFlash = useCallback(() => setShowFlash(false), []);

  const handlePeaceSign = useCallback(() => {
    if (appState === "camera" && isReady) {
      setAppState("countdown");
    }
  }, [appState, isReady]);

  const gestureCallbacks = useMemo(() => ({
    onVictory: handlePeaceSign,
  }), [handlePeaceSign]);

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

  const resetTimerRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(resetTimerRef.current);
  }, []);

  const handleCountdownComplete = useCallback(async () => {
    setAppState("capturing");
    setShowFlash(true);

    try {
      const video = videoRef.current;
      if (!video) throw new Error("Video element not available");

      const container = containerRef.current;
      if (!container) throw new Error("Container element not available");

      const { exportBlob, galleryDataUrl } = await compositePhoto(
        video,
        container,
        isMirrored
      );

      addPhoto(galleryDataUrl);
      setAppState("sending");

      const success = await sendToDiscord(exportBlob);
      toast.show(success ? "Verzonden!" : "Verzenden naar Discord mislukt");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Er ging iets mis";
      toast.show(message);
    } finally {
      resetTimerRef.current = setTimeout(() => setAppState("camera"), 1500);
    }
  }, [videoRef, addPhoto, toast, isMirrored]);

  const boothContext = useMemo(() => ({
    videoRef,
    containerRef,
    isReady,
    splashDone,
    isRecalibrating,
    isSwitching,
    isMirrored,
    devices,
    selectedDeviceId,
    switchCamera,
    onCapture: handleCapture,
    disabled: appState !== "camera" && appState !== "countdown",
    galleryCount: photos.length,
    openGallery,
    canInstall,
    onInstall: promptInstall,
    activeGesture,
    layout,
    mascot,
    activeConvention,
    setLayoutId,
    setMascotId,
    showMascotPicker,
    showLayoutPicker,
    openMascotPicker,
    closeMascotPicker,
    openLayoutPicker,
    closeLayoutPicker,
    showAbout,
    openAbout,
    closeAbout,
  }), [
    isReady, splashDone, isRecalibrating, isSwitching, isMirrored,
    devices, selectedDeviceId, switchCamera, handleCapture, appState,
    photos.length, openGallery, canInstall, promptInstall, activeGesture,
    layout, mascot, activeConvention, setLayoutId, setMascotId,
    showMascotPicker, showLayoutPicker, openMascotPicker, closeMascotPicker,
    openLayoutPicker, closeLayoutPicker,
    showAbout, openAbout, closeAbout,
  ]);

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

          {devices.length > 1 && (
            <div className="mt-6">
              <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Andere camera kiezen</p>
              <div className="flex flex-col gap-2">
                {devices.map((device) => (
                  <button
                    key={device.deviceId}
                    onClick={() => switchCamera(device.deviceId)}
                    className={`px-4 py-3 rounded-xl text-sm transition-colors cursor-pointer ${
                      device.deviceId === selectedDeviceId
                        ? "bg-white/15 text-white font-medium"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {device.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <BoothProvider value={boothContext}>
      <CameraView />

      {appState === "countdown" && (
        <Countdown
          seconds={COUNTDOWN_SECONDS}
          onComplete={handleCountdownComplete}
          showLookUp={LOOK_UP_PROMPT_ENABLED}
        />
      )}

      {showFlash && <FlashEffect onComplete={clearFlash} />}

      {toast.message && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 text-white text-sm font-medium animate-fade-in">
          {toast.message}
        </div>
      )}

      <Gallery
        photos={photos}
        isOpen={showGallery}
        onClose={closeGallery}
        onRemove={removePhoto}
      />

      {showBanner && (
        <InstallBanner
          isIOS={isIOS}
          onInstall={promptInstall}
          onDismiss={dismissBanner}
        />
      )}
    </BoothProvider>
  );
}
