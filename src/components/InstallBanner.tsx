"use client";

import { DownloadIcon, ShareIcon, CloseIcon } from "./icons";

export function InstallBanner({
  isIOS,
  onInstall,
  onDismiss,
}: {
  isIOS: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-gray-950/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl max-w-sm mx-auto">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e6c189]/20 flex items-center justify-center flex-shrink-0">
            <DownloadIcon className="w-5 h-5 text-[#e6c189]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">
              Install Photo Booth
            </p>
            {isIOS ? (
              <p className="text-white/50 text-xs mt-0.5">
                Druk{" "}
                <ShareIcon className="inline w-4 h-4 text-white/70 align-text-bottom" />{" "}
               en kies &ldquo;voeg toe aan homescherm&rdquo;
              </p>
            ) : (
              <p className="text-white/50 text-xs mt-0.5">
                Voeg de app toe aan je homescherm
              </p>
            )}
          </div>
          <button
            onClick={onDismiss}
            className="text-white/30 hover:text-white/60 transition-colors cursor-pointer flex-shrink-0"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        {!isIOS && (
          <button
            onClick={onInstall}
            className="mt-3 w-full py-2 rounded-lg bg-[#e6c189] text-black text-sm font-semibold hover:bg-[#d4af72] transition-colors cursor-pointer"
          >
            Installeren
          </button>
        )}
      </div>
    </div>
  );
}
