import { CloseIcon } from "../icons";

export function AppQrModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-950/95 border border-white/10 rounded-2xl p-6 shadow-2xl max-w-xs w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-white text-center font-semibold mb-1">Open op je telefoon</p>
        <p className="text-white/50 text-xs text-center mb-4">Scan de QR code met je camera</p>
        <img
          src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/overlays/qr-app.svg`}
          alt="QR code naar app"
          className="w-full aspect-square"
        />
        <button
          onClick={onClose}
          className="mt-2 w-full py-2 rounded-lg bg-white/10 text-white/70 text-sm hover:bg-white/20 transition-colors cursor-pointer"
        >
          Sluiten
        </button>
      </div>
    </div>
  );
}
