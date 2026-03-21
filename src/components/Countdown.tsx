"use client";

import { useEffect, useState, useRef } from "react";

interface CountdownProps {
  seconds: number;
  onComplete: () => void;
}

export function Countdown({ seconds, onComplete }: CountdownProps) {
  const [count, setCount] = useState(seconds);
  const firedRef = useRef(false);

  useEffect(() => {
    if (count <= 0) {
      if (!firedRef.current) {
        firedRef.current = true;
        onComplete();
      }
      return;
    }

    const timer = setTimeout(() => {
      setCount((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  if (count <= 0) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
      <span
        key={count}
        className="text-[12rem] font-black text-white drop-shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-countdown select-none"
      >
        {count}
      </span>
    </div>
  );
}
