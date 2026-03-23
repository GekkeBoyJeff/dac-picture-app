import { LAYOUTS, type LayoutPreset } from "@/lib/config";
import type { OverlayPosition } from "@/lib/types";
import { BottomDrawer } from "../BottomDrawer";

interface LayoutPickerProps {
  currentId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

function LayoutPreview({ layout }: { layout: LayoutPreset }) {
  return (
    <div className="w-28 h-20 rounded-xl bg-white/5 relative overflow-hidden border border-white/5">
      <Block position={layout.logo.position} className="w-3 h-3 rounded-sm bg-white/60" />
      <Block position={layout.qr.position} className="w-3.5 h-3.5 rounded-sm bg-white/25" />
      <Block position={layout.mascot.position} className="w-5 h-7 rounded-sm bg-[#e6c189]/50" />
      <Block position={layout.convention.position} className="w-7 h-3 rounded-sm bg-red-400/40" />
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-white/20" />
    </div>
  );
}

function Block({ position, className }: { position: OverlayPosition; className: string }) {
  const pos: React.CSSProperties = { position: "absolute" };
  if (position.includes("top")) pos.top = 4;
  if (position.includes("bottom")) pos.bottom = 4;
  if (position.includes("left")) pos.left = 4;
  if (position.includes("right")) pos.right = 4;
  if (position === "middle-right") {
    pos.right = 4;
    pos.top = "50%";
    pos.transform = "translateY(-50%)";
  }
  return <div className={className} style={pos} />;
}

export function LayoutPicker({ currentId, onSelect, onClose }: LayoutPickerProps) {
  return (
    <BottomDrawer title="Layout" onClose={onClose} closeOnSelect>
      <div className="flex gap-4 overflow-x-auto pb-2 px-3 scrollbar-none">
        {LAYOUTS.map((l) => (
          <button
            key={l.id}
            onClick={() => { onSelect(l.id); }}
            className={`shrink-0 flex flex-col items-center gap-2 cursor-pointer transition-all ${
              l.id === currentId ? "opacity-100" : "opacity-50 hover:opacity-75"
            }`}
          >
            <div className={`rounded-xl ${
              l.id === currentId ? "border-2 border-white" : "border-2 border-transparent"
            }`}>
              <LayoutPreview layout={l} />
            </div>
            <span className="text-white text-[11px] font-medium">{l.name}</span>
          </button>
        ))}
      </div>
    </BottomDrawer>
  );
}
