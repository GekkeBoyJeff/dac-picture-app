import { readFileSync } from "fs"

const { version } = JSON.parse(readFileSync("./package.json", "utf-8"))

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.1.81"],
  output: "export",
  basePath: process.env.GITHUB_ACTIONS ? "/dac-picture-app" : "",
  images: {
    unoptimized: true,
  },
  env: {
    APP_VERSION: version,
  },
}

export default nextConfig