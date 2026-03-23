/** Overlay dimensions in rem */
export interface OverlaySize {
  maxWidth: number;
  maxHeight: number;
}

export type OverlayPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "middle-right"
  | "full";

export interface PhotoEntry {
  id: string;
  dataUrl: string;
  createdAt: number;
}
