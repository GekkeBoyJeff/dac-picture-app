"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { GestureRecognizer, FilesetResolver } from "@mediapipe/tasks-vision";

const DETECTION_INTERVAL_MS = 1000;
const CONFIDENCE_THRESHOLD = 0.3;
// Two consecutive detections required to prevent accidental triggers
// from noise or brief hand movements
const REQUIRED_CONSECUTIVE_VICTORY = 2;

export function useHandGesture(videoRef, enabled, callbacks) {
  const recognizerRef = useRef(null);
  const animFrameRef = useRef(0);
  const lastTimestampRef = useRef(-1);
  const [activeGesture, setActiveGesture] = useState(null);

  const victoryConsecutiveRef = useRef(0);
  const victoryFiredRef = useRef(false);

  // Reset so a new countdown can be triggered after the previous one completes
  useEffect(() => {
    if (enabled) {
      victoryFiredRef.current = false;
      victoryConsecutiveRef.current = 0;
      setActiveGesture(null);
    }
  }, [enabled]);

  const initRecognizer = useCallback(async () => {
    if (recognizerRef.current) return;

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    const modelOptions = {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 1,
    };

    // MediaPipe WASM logs "INFO: Created TensorFlow Lite XNNPACK delegate"
    // via stderr which Next.js dev overlay catches as an error. Suppress it.
    const origError = console.error;
    const origWarn = console.warn;
    console.error = (...args) => {
      if (typeof args[0] === "string" && args[0].includes("TensorFlow Lite")) return;
      origError(...args);
    };
    console.warn = (...args) => {
      if (typeof args[0] === "string" && args[0].includes("TensorFlow Lite")) return;
      origWarn(...args);
    };

    try {
      recognizerRef.current = await GestureRecognizer.createFromOptions(vision, modelOptions);
    } catch {
      // GPU delegate failed (e.g. external webcam codec issue) — fall back to CPU
      recognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
        ...modelOptions,
        baseOptions: { ...modelOptions.baseOptions, delegate: "CPU" },
      });
    } finally {
      console.error = origError;
      console.warn = origWarn;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let stopped = false;

    const run = async () => {
      await initRecognizer();
      if (stopped) return;

      const detect = () => {
        if (stopped || !enabled) return;

        const video = videoRef.current;
        const recognizer = recognizerRef.current;

        if (
          video &&
          recognizer &&
          video.readyState >= 2 &&
          video.videoWidth > 0
        ) {
          const now = performance.now();
          if (now > lastTimestampRef.current) {
            lastTimestampRef.current = now;
            try {
              // MediaPipe spams console with non-actionable warnings per frame
              const origError = console.error;
              const origWarn = console.warn;
              console.error = () => {};
              console.warn = () => {};
              let result;
              try {
                result = recognizer.recognizeForVideo(video, now);
              } finally {
                console.error = origError;
                console.warn = origWarn;
              }

              const gestures = result.gestures;

              let bestGesture = null;
              let bestScore = 0;
              for (const gestureList of gestures) {
                for (const g of gestureList) {
                  if (g.score >= CONFIDENCE_THRESHOLD && g.score > bestScore) {
                    bestGesture = g.categoryName;
                    bestScore = g.score;
                  }
                }
              }

              if (bestGesture === "Victory") {
                victoryConsecutiveRef.current++;
                setActiveGesture("Victory");

                if (
                  victoryConsecutiveRef.current >= REQUIRED_CONSECUTIVE_VICTORY &&
                  !victoryFiredRef.current
                ) {
                  victoryFiredRef.current = true;
                  setActiveGesture(null);
                  callbacks.onVictory();
                  return;
                }
              } else {
                victoryConsecutiveRef.current = 0;
                setActiveGesture(null);
              }
            } catch {}
          }
        }

        setTimeout(() => {
          if (!stopped) {
            animFrameRef.current = requestAnimationFrame(detect);
          }
        }, DETECTION_INTERVAL_MS);
      };

      animFrameRef.current = requestAnimationFrame(detect);
    };

    run();

    return () => {
      stopped = true;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [enabled, videoRef, callbacks, initRecognizer]);

  useEffect(() => {
    return () => {
      recognizerRef.current?.close();
      recognizerRef.current = null;
    };
  }, []);

  return { activeGesture };
}
