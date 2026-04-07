import { BottomDrawer } from "@/components/ui/BottomDrawer"
import { drawerCardClass, drawerButtonBaseClass, drawerOptionCardClass, drawerSectionHelpClass, drawerSectionLabelClass } from "@/components/ui/drawerStyles"

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
                <p className={`mt-1 ${drawerSectionHelpClass}`}>{subtitle || "Kies een optie uit de vaste selectie hieronder."}</p>
              </div>
              {selectedOption && (
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
                  Geselecteerd
                </div>
              )}
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
                className={`${drawerButtonBaseClass} ${drawerOptionCardClass} group flex min-h-[13rem] flex-col items-stretch gap-3 p-3 text-left ${
                  isSelected
                    ? "border-white/30 bg-white/[0.09] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                    : "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.65rem] uppercase tracking-[0.2em] text-white/35">{isSelected ? "Actief" : "Optie"}</p>
                    <span className="mt-1 block text-sm font-semibold text-white">{getOptionLabel(option)}</span>
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-[0.65rem] font-medium ${isSelected ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-white/5 text-white/45"}`}>
                    {isSelected ? "Gekozen" : "Kies"}
                  </span>
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