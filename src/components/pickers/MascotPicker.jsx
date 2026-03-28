import Image from "next/image"
import { MASCOTS } from "@/lib/config"
import { useOverlayStore, selectMascot } from "@/stores/overlayStore"
import { PickerDrawer } from "./PickerDrawer"

export function MascotPicker({ onClose }) {
  const mascot = useOverlayStore(selectMascot)
  const setMascotId = useOverlayStore((s) => s.setMascotId)

  return (
    <PickerDrawer
      title="Mascot"
      onClose={onClose}
      options={MASCOTS}
      selectedId={mascot.id}
      onSelect={setMascotId}
      getOptionKey={(item) => item.id}
      getOptionLabel={(item) => item.name}
      renderOption={(item, isSelected) => (
        <div
          className={`w-20 h-20 rounded-2xl overflow-hidden border-2 ${
            isSelected ? "border-white" : "border-transparent"
          }`}
        >
          <Image
            src={item.thumbnail}
            alt={item.name}
            width={80}
            height={80}
            className="w-full h-full object-contain"
            draggable={false}
          />
        </div>
      )}
    />
  )
}