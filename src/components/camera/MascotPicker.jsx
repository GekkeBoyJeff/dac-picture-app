import Image from "next/image"
import { MASCOTS } from "@/lib/config"
import { useOverlayContext, useModalContext } from "@/context"
import { PickerDrawer } from "./PickerDrawer"

export function MascotPicker() {
  const { mascot, setMascotId } = useOverlayContext()
  const { closeMascotPicker } = useModalContext()

  return (
    <PickerDrawer
      title="Mascot"
      onClose={closeMascotPicker}
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