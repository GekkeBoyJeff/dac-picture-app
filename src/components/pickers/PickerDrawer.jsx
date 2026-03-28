import { BottomDrawer } from "@/components/ui/BottomDrawer"

export function PickerDrawer({
  title,
  onClose,
  options,
  selectedId,
  onSelect,
  getOptionKey,
  renderOption,
  getOptionLabel,
}) {
  return (
    <BottomDrawer title={title} onClose={onClose} closeOnSelect>
      <div className="flex gap-4 overflow-x-auto pb-2 px-3 scrollbar-none">
        {options.map((option) => {
          const optionKey = getOptionKey(option)
          const isSelected = optionKey === selectedId

          return (
            <button
              key={optionKey}
              onClick={() => onSelect(optionKey)}
              className={`shrink-0 flex flex-col items-center gap-2 cursor-pointer transition-all ${
                isSelected ? "opacity-100" : "opacity-50 hover:opacity-75"
              }`}
            >
              {renderOption(option, isSelected)}
              <span className="text-white text-[0.6875rem] font-medium">{getOptionLabel(option)}</span>
            </button>
          )
        })}
      </div>
    </BottomDrawer>
  )
}