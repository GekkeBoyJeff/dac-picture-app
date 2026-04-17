import { BottomDrawer } from "@/components/ui/BottomDrawer"

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
          <div className="rounded-none border border-white/10 bg-black p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[0.7rem] uppercase tracking-[0.24em] text-white/40 font-mono">
                  {title}
                </p>
                <p className="mt-1 text-xs leading-5 text-white/40">
                  {subtitle || "Kies een optie uit de vaste selectie hieronder."}
                </p>
              </div>
              {selectedOption && (
                <div className="rounded-none border border-white/10 px-3 py-1 text-xs font-mono text-white">
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
                className={`group flex min-h-[13rem] flex-col items-stretch gap-3 rounded-none border p-3 text-left transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "border-[#e6c189] bg-[#111]"
                    : "border-white/10 bg-black hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[0.65rem] uppercase tracking-[0.2em] text-white/40 font-mono">
                      {isSelected ? "Actief" : "Optie"}
                    </p>
                    <span className="mt-1 block text-sm font-bold text-white">
                      {getOptionLabel(option)}
                    </span>
                  </div>
                  <span
                    className={`rounded-none border px-2 py-1 text-[0.65rem] font-mono font-bold ${
                      isSelected
                        ? "border-[#e6c189] text-[#e6c189]"
                        : "border-white/10 text-white/40"
                    }`}
                  >
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
