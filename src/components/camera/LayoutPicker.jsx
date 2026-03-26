import { LAYOUTS } from "@/lib/config"
import { useOverlayContext, useModalContext } from "@/context"
import { PickerDrawer } from "./PickerDrawer"

function LayoutPreview({ layout }) {
  return (
    <div className="w-28 h-20 rounded-xl bg-white/5 relative overflow-hidden border border-white/5">
      <Block position={layout.logo.position} className="w-3 h-3 rounded-sm bg-white/60" />
      <Block position={layout.qr.position} className="w-3.5 h-3.5 rounded-sm bg-white/25" />
      <Block position={layout.mascot.position} className="w-5 h-7 rounded-sm bg-[#e6c189]/50" />
      <Block position={layout.convention.position} className="w-7 h-3 rounded-sm bg-red-400/40" />
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-white/20" />
    </div>
  )
}

function Block({ position, className }) {
  const pos = { position: "absolute" }
  if (position.includes("top")) pos.top = 4
  if (position.includes("bottom")) pos.bottom = 4
  if (position.includes("left")) pos.left = 4
  if (position.includes("right")) pos.right = 4
  if (position === "middle-right") {
    pos.right = 4
    pos.top = "50%"
    pos.transform = "translateY(-50%)"
  }
  return <div className={className} style={pos} />
}

export function LayoutPicker() {
  const { layout, setLayoutId } = useOverlayContext()
  const { closeLayoutPicker } = useModalContext()

  return (
    <PickerDrawer
      title="Layout"
      onClose={closeLayoutPicker}
      options={LAYOUTS}
      selectedId={layout.id}
      onSelect={setLayoutId}
      getOptionKey={(item) => item.id}
      getOptionLabel={(item) => item.name}
      renderOption={(item, isSelected) => (
        <div
          className={`rounded-xl ${
            isSelected ? "border-2 border-white" : "border-2 border-transparent"
          }`}
        >
          <LayoutPreview layout={item} />
        </div>
      )}
    />
  )
}