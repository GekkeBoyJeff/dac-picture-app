/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.1.81"],
  output: "export",
  basePath: process.env.GITHUB_ACTIONS ? "/dac-picture-app" : "",
  images: {
    unoptimized: true,
  },
}

export default nextConfig