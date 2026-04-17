import { LAYOUTS } from "@/lib/config"
import { useOverlayStore, selectLayout } from "@/features/overlay/store"
import { PickerDrawer } from "./PickerDrawer"
import { LayoutPreviewBlock } from "./LayoutPreviewBlock"

function LayoutPreview({ layout }) {
  return (
    <div className="w-28 h-20 rounded-none bg-[#111] relative overflow-hidden border border-white/10">
      <LayoutPreviewBlock
        position={layout.logo.position}
        className="w-3 h-3 rounded-none bg-white/60"
      />
      <LayoutPreviewBlock
        position={layout.qr.position}
        className="w-3.5 h-3.5 rounded-none bg-white/20"
      />
      <LayoutPreviewBlock
        position={layout.mascot.position}
        className="w-5 h-7 rounded-none bg-[#e6c189]/50"
      />
      <LayoutPreviewBlock
        position={layout.convention.position}
        className="w-7 h-3 rounded-none bg-white/20"
      />
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-px bg-white/20" />
    </div>
  )
}

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
          className={`rounded-none ${isSelected ? "border-2 border-white" : "border-2 border-transparent"}`}
        >
          <LayoutPreview layout={item} />
        </div>
      )}
    />
  )
}
