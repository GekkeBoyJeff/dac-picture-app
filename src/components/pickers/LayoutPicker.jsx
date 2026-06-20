import { LAYOUTS } from "@/lib/config"
import { useOverlayStore, selectLayout } from "@/stores/overlayStore"
import { cn } from "@/lib/styles/cn"
import { PickerDrawer } from "./PickerDrawer"
import { LayoutPreview } from "./LayoutPreview"

export function LayoutPicker({ onClose }) {
  const layout = useOverlayStore(selectLayout)
  const setLayoutId = useOverlayStore((s) => s.setLayoutId)

  return (
    <PickerDrawer
      title="Opmaak"
      subtitle="Kies de kaart- en overlayopstelling voor de foto-uitvoer."
      onClose={onClose}
      options={LAYOUTS}
      selectedId={layout.id}
      onSelect={setLayoutId}
      getOptionKey={(item) => item.id}
      getOptionLabel={(item) => item.name}
      renderOption={(item, isSelected) => (
        <div
          className={cn(
            "rounded-xl p-1 transition-all duration-200",
            isSelected
              ? "ring-2 ring-gold shadow-[0_0_24px_rgba(230,193,137,0.28)]"
              : "ring-1 ring-hairline",
          )}
        >
          <LayoutPreview layout={item} size="sm" />
        </div>
      )}
    />
  )
}