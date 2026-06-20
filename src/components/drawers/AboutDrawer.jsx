import Image from "next/image"
import { BottomDrawer } from "@/components/ui/BottomDrawer"
import { Surface } from "@/components/ui/Surface"
import { assetPath } from "@/lib/config/basePath"

export function AboutDrawer({ onClose }) {
  return (
    <BottomDrawer
      title="Over deze app"
      subtitle="Korte achtergrond en versie-informatie."
      onClose={onClose}
      showHeaderDivider={false}
    >
      <div className="py-1">
        <Surface radius="md" pad="none" className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10">
              <Image
                src={assetPath("/overlays/logo.svg")}
                alt=""
                width={32}
                height={32}
                className="h-8 w-8"
                draggable={false}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-base font-semibold tracking-wide text-ink">
                    DAC Fotobooth
                  </h2>
                  <p className="mt-1 text-xs text-gold">v{process.env.APP_VERSION}</p>
                </div>
              </div>

              <p className="mt-3 max-w-[30rem] text-sm leading-6 text-ink-muted">
                Fotobooth met camera-overlays, strip-modus, Discord-upload en een PWA-opzet voor
                event gebruik.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-hairline pt-3">
                <p className="text-[0.7rem] uppercase tracking-[0.2em] text-ink-dim">Maker</p>
                <p className="text-sm text-ink">
                  Jeffrey Ullers ·{" "}
                  <a
                    href="https://www.jeffreyullers.nl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold underline underline-offset-2 transition-colors hover:text-gold-strong"
                  >
                    jeffreyullers.nl
                  </a>
                </p>
              </div>
            </div>
          </div>
        </Surface>
      </div>
    </BottomDrawer>
  )
}