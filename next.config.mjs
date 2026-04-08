import { readFileSync, writeFileSync } from "fs"

const { version } = JSON.parse(readFileSync("./package.json", "utf-8"))

const basePath = process.env.GITHUB_ACTIONS ? "/dac-picture-app" : ""

// Generate version.json so the service worker can detect new releases
writeFileSync("./public/version.json", JSON.stringify({ version, basePath }))

// Generate manifest.json with correct basePath so start_url/scope match the deploy target
const manifest = {
  name: "DAC Fotobooth",
  short_name: "Fotobooth",
  description: "Maak een foto en bekijk hem direct in de Discord-server.",
  start_url: `${basePath}/`,
  scope: `${basePath}/`,
  display: "standalone",
  background_color: "#e6c189",
  theme_color: "#e6c189",
  orientation: "any",
  icons: [
    {
      src: "overlays/logo.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "overlays/logo.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
}
writeFileSync("./public/manifest.json", JSON.stringify(manifest, null, 2))

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.1.81"],
  output: "export",
  basePath,
  images: {
    unoptimized: true,
  },
  env: {
    APP_VERSION: version,
  },
}

export default nextConfig