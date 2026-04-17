import { assetPath } from "./basePath"

export const CORNERS = [
  { src: assetPath("/overlays/corner-tl.svg"), position: "top-left" },
  { src: assetPath("/overlays/corner-tr.svg"), position: "top-right" },
  { src: assetPath("/overlays/corner-bl.svg"), position: "bottom-left" },
  { src: assetPath("/overlays/corner-br.svg"), position: "bottom-right" },
]

export const LOGO = {
  src: assetPath("/overlays/logo.svg"),
}

export const QR_CODE = {
  src: assetPath("/overlays/qr-discord.svg"),
}