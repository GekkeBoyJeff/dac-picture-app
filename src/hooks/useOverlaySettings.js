"use client";

import { useState, useEffect } from "react";
import {
  LAYOUTS,
  DEFAULT_LAYOUT_ID,
  MASCOTS,
  DEFAULT_MASCOT_ID,
  getActiveConvention,
} from "@/lib/config";

const LAYOUT_KEY = "overlay-layout";
const MASCOT_KEY = "overlay-mascot";

export function useOverlaySettings() {
  // SSR-safe: start with defaults, hydrate from localStorage on mount
  const [layoutId, setLayoutId] = useState(DEFAULT_LAYOUT_ID);
  const [mascotId, setMascotId] = useState(DEFAULT_MASCOT_ID);

  useEffect(() => {
    setLayoutId(localStorage.getItem(LAYOUT_KEY) || DEFAULT_LAYOUT_ID);
    setMascotId(localStorage.getItem(MASCOT_KEY) || DEFAULT_MASCOT_ID);
  }, []);

  useEffect(() => {
    localStorage.setItem(LAYOUT_KEY, layoutId);
  }, [layoutId]);

  useEffect(() => {
    localStorage.setItem(MASCOT_KEY, mascotId);
  }, [mascotId]);

  const layout = LAYOUTS.find((l) => l.id === layoutId) || LAYOUTS[0];
  const mascot = MASCOTS.find((m) => m.id === mascotId) || MASCOTS[0];
  const activeConvention = getActiveConvention();

  return { layout, mascot, activeConvention, setLayoutId, setMascotId };
}
