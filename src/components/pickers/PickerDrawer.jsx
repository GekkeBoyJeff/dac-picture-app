import { BottomDrawer } from "@/components/ui/BottomDrawer"
import { StatusPill } from "@/components/ui/StatusPill"
import { cn } from "@/lib/styles/cn"
import {
  drawerCardClass,
  drawerButtonBaseClass,
  drawerOptionCardClass,
  drawerSectionHelpClass,
  drawerSectionLabelClass,
  drawerFocusRingClass,
} from "@/components/ui/drawerStyles"

function CheckPin() {
  return (
    <span
      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-b from-gold-strong via-gold to-gold-deep text-[#1b1407] shadow-[0_0_14px_rgba(230,193,137,0.45)]"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  )
}

export function PickerDrawer({
  title,
  subtitle,
  onClose,
  options,
  selectedId,
  onSelect,
  getOptionKey,
  renderOption,
  getOptionLabel,
  showSummaryCard = true,
}) {
  const selectedOption = options.find((option) => getOptionKey(option) === selectedId)

  return (
    <BottomDrawer title={title} subtitle={subtitle} onClose={onClose} closeOnSelect fullHeight>
      <div className="space-y-4">
        {showSummaryCard && (
          <div className={`${drawerCardClass} p-4`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className={drawerSectionLabelClass}>{title}</p>
                <p className={`mt-1 ${drawerSectionHelpClass}`}>
                  {subtitle || "Kies een optie uit de vaste selectie hieronder."}
                </p>
              </div>
              {selectedOption && <StatusPill tone="gold">Geselecteerd</StatusPill>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {options.map((option) => {
            const optionKey = getOptionKey(option)
            const isSelected = optionKey === selectedId

            return (
              <button
                key={optionKey}
                onClick={() => onSelect(optionKey)}
                aria-pressed={isSelected}
                className={cn(
                  drawerButtonBaseClass,
                  drawerOptionCardClass,
                  drawerFocusRingClass,
                  "group relative flex min-h-[13rem] flex-col items-stretch gap-3 p-3 text-left",
                  isSelected
                    ? "border-gold/55 bg-gold/[0.08] shadow-[0_0_0_1px_var(--color-gold),0_0_28px_rgba(230,193,137,0.22)]"
                    : "hover:border-hairline-strong hover:bg-raised",
                )}
              >
                {isSelected && <CheckPin />}

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-[0.65rem] uppercase tracking-[0.2em]",
                        isSelected ? "text-gold" : "text-ink-dim",
                      )}
                    >
                      {isSelected ? "Actief" : "Optie"}
                    </p>
                    <span className="mt-1 block text-sm font-semibold text-ink">
                      {getOptionLabel(option)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 items-center justify-center px-1">
                  {renderOption(option, isSelected)}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </BottomDrawer>
  )
}