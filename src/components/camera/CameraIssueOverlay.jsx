"use client"

import { CameraEmptyIcon, InfoIcon, WarningIcon } from "@/components/ui/icons"

function formatError(error) {
  if (!error) return "De camera kon niet worden gestart."
  return error
}

export function CameraIssueOverlay({ error, deviceCount = 0, onRetry }) {
  const isPermissionError = /toegang geweigerd|permission|notallowed/i.test(error || "")
  const isNoCameraError = /geen camera|not found|no camera/i.test(error || "") || deviceCount === 0

  const title = isPermissionError
    ? "Camera-toestemming nodig"
    : isNoCameraError
      ? "Geen camera gevonden"
      : "Camera start niet"

  const subtitle = isPermissionError
    ? "Sta cameratoegang toe in je browser en laad de pagina opnieuw."
    : isNoCameraError
      ? "Controleer of een camera is aangesloten en beschikbaar is voor deze browser."
      : "Er is iets misgegaan bij het opstarten van de camera."

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center px-6 py-8"
      style={{
        background:
          "radial-gradient(circle at top, rgba(230,193,137,0.16), transparent 32%), radial-gradient(circle at bottom right, rgba(230,193,137,0.06), transparent 30%), linear-gradient(180deg, rgba(12,11,16,0.97), rgba(12,11,16,0.93))",
      }}
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-hairline-strong bg-raised shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
        <div className="grid gap-0 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="border-b border-hairline p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <div className="inline-flex items-center gap-2 rounded-full border border-warning/25 bg-warning/10 px-3 py-1 text-[0.7rem] uppercase tracking-[0.2em] text-warning">
              <WarningIcon className="h-3.5 w-3.5" />
              Camera fout
            </div>

            <div className="mt-5 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-hairline bg-surface">
                <CameraEmptyIcon className="h-6 w-6 text-ink-muted" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
                  {title}
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-ink-muted">{subtitle}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["Stap 1", "Controleer of de browser cameratoegang mag gebruiken."],
                ["Stap 2", "Kijk of de camera echt verbonden en niet bezet is."],
                ["Stap 3", "Probeer daarna opnieuw of laad de pagina opnieuw."],
              ].map(([step, body]) => (
                <div key={step} className="rounded-2xl border border-hairline bg-surface p-4">
                  <p className="text-sm font-medium text-ink">{step}</p>
                  <p className="mt-1 text-xs leading-5 text-ink-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="space-y-3">
              <div className="rounded-2xl border border-hairline bg-surface p-4">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-ink-dim">
                  Technische melding
                </p>
                <p className="mt-2 text-sm leading-6 text-ink">{formatError(error)}</p>
              </div>

              <div className="rounded-2xl border border-hairline bg-surface p-4">
                <div className="flex items-start gap-3">
                  <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">Wat je nu kunt doen</p>
                    <p className="mt-1 text-xs leading-5 text-ink-muted">
                      Als je op een Raspberry Pi zit, controleer de kabel en of de juiste camera is
                      aangesloten. Bij een normale pc is toestemming in de browser meestal de
                      oorzaak.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onRetry}
                className="w-full cursor-pointer rounded-2xl bg-linear-to-b from-gold-strong via-gold to-gold-deep px-4 py-4 text-left text-[#1b1407] shadow-[0_6px_20px_rgba(230,193,137,0.28)] transition-all hover:brightness-105"
              >
                <p className="text-sm font-semibold">Opnieuw proberen</p>
                <p className="mt-1 text-xs leading-5 text-[#1b1407]/70">
                  Start de camera opnieuw met de huidige instellingen.
                </p>
              </button>

              <div className="text-xs leading-5 text-ink-muted">
                {deviceCount > 0
                  ? `${deviceCount} camera's gedetecteerd. `
                  : "Geen camera gedetecteerd. "}
                Controleer de hardware of geef cameratoegang opnieuw.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}