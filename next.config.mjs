import { readFileSync, writeFileSync } from "fs"

const { version } = JSON.parse(readFileSync("./package.json", "utf-8"))

const basePath = process.env.GITHUB_ACTIONS ? "/dac-picture-app" : ""

// Generate version.json so the service worker can detect new releases
writeFileSync("./public/version.json", JSON.stringify({ version, basePath }))

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