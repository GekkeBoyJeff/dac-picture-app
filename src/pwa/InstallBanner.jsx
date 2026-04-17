"use client"

import { DownloadIcon, ShareIcon, CloseIcon } from "@/components/ui/icons"

/**
 * PWA install prompt (Android) or manual instructions (iOS).
 * Pi-safe: opaque surface, no backdrop-blur.
 */
export function InstallBanner({ isIOS, onInstall, onDismiss }) {
  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-black border border-white/20 rounded-none p-4 max-w-sm mx-auto">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-none border border-[#e6c189] flex items-center justify-center flex-shrink-0">
            <DownloadIcon className="w-5 h-5 text-[#e6c189]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold">Installeer DAC Photo Booth</p>
            {isIOS ? (
              <p className="text-white/40 text-xs mt-0.5">
                Tik op <ShareIcon className="inline w-4 h-4 text-white/60 align-text-bottom" /> en
                kies &ldquo;Zet op beginscherm&rdquo;
              </p>
            ) : (
              <p className="text-white/40 text-xs mt-0.5">Voeg de app toe aan je beginscherm</p>
            )}
          </div>
          <button
            onClick={onDismiss}
            className="text-white/40 hover:text-white transition-colors cursor-pointer flex-shrink-0"
            aria-label="Sluiten"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        {!isIOS && (
          <button
            onClick={onInstall}
            className="mt-3 w-full py-2 rounded-none bg-[#e6c189] text-black text-sm font-bold hover:bg-[#d4af72] transition-colors cursor-pointer active:scale-[0.98]"
          >
            Installeren
          </button>
        )}
      </div>
    </div>
  )
}
