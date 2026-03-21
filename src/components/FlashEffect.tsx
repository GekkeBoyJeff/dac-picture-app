"use client";

import { useEffect, useRef } from "react";

interface FlashEffectProps {
  onComplete: () => void;
}

export function FlashEffect({ onComplete }: FlashEffectProps) {
  const firedRef = useRef(false);

  const handleComplete = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    onComplete();
  };

  useEffect(() => {
    const timeout = setTimeout(handleComplete, 600);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-white animate-flash pointer-events-none"
      onAnimationEnd={handleComplete}
    />
  );
}
