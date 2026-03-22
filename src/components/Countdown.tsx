"use client";

import { useEffect, useState, useRef } from "react";

interface CountdownProps {
  seconds: number;
  onComplete: () => void;
  showLookUp?: boolean;
}

export function Countdown({ seconds, onComplete, showLookUp = false }: CountdownProps) {
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
      {showLookUp && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <svg
            className="w-16 h-16 text-white drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
          </svg>
          <span className="text-white text-2xl font-bold tracking-wide drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] text-center">
            Look up!<br />
            Kijk omhoog!
          </span>
        </div>
      )}
    </div>
  );
}
