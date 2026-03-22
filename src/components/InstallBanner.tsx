"use client";

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
            <svg
              className="w-5 h-5 text-[#e6c189]"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">
              Installeer Photo Booth
            </p>
            {isIOS ? (
              <p className="text-white/50 text-xs mt-0.5">
                Tik op{" "}
                <svg
                  className="inline w-4 h-4 text-white/70 align-text-bottom"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v11.25"
                  />
                </svg>{" "}
                en kies &ldquo;Zet op beginscherm&rdquo;
              </p>
            ) : (
              <p className="text-white/50 text-xs mt-0.5">
                Voeg de app toe aan je startscherm
              </p>
            )}
          </div>
          <button
            onClick={onDismiss}
            className="text-white/30 hover:text-white/60 transition-colors cursor-pointer flex-shrink-0"
            aria-label="Sluiten"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
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
