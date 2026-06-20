"use client"

import { DownloadIcon, ShareIcon, CloseIcon } from "@/components/ui/icons"
import { Button } from "@/components/ui/Button"
import { Surface } from "@/components/ui/Surface"

export function InstallBanner({ isIOS, onInstall, onDismiss }) {
  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 animate-slide-up">
      <Surface raised radius="md" pad="md" className="max-w-sm mx-auto backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center flex-shrink-0">
            <DownloadIcon className="w-5 h-5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-ink text-sm font-semibold">Installeer DAC Photo Booth</p>
            {isIOS ? (
              <p className="text-ink-muted text-xs mt-0.5">
                Tik op <ShareIcon className="inline w-4 h-4 text-ink align-text-bottom" /> en kies
                &ldquo;Zet op beginscherm&rdquo;
              </p>
            ) : (
              <p className="text-ink-muted text-xs mt-0.5">Voeg de app toe aan je beginscherm</p>
            )}
          </div>
          <button
            onClick={onDismiss}
            className="text-ink-dim hover:text-ink transition-colors cursor-pointer flex-shrink-0"
            aria-label="Sluiten"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        {!isIOS && (
          <Button variant="primary" size="sm" onClick={onInstall} className="mt-3 w-full">
            Installeren
          </Button>
        )}
      </Surface>
    </div>
  )
}