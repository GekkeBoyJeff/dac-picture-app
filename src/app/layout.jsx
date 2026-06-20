import { Inter, Space_Grotesk } from "next/font/google"
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar"
import { assetPath } from "@/lib/config/basePath"
import "./globals.css"

// Body / UI — legible at distance for a kiosk.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

// Display — characterful but premium; carries the personality.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
})

/** @type {import('next').Viewport} */
export const viewport = {
  themeColor: "#e6c189",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

/** @type {import('next').Metadata} */
export const metadata = {
  title: "DAC Fotobooth",
  description: "Maak een foto en deel hem direct in Discord.",
  manifest: assetPath("/manifest.json"),
  icons: {
    icon: assetPath("/overlays/logo.png"),
    apple: assetPath("/overlays/logo.png"),
  },
  openGraph: {
    title: "DAC Fotobooth",
    description: "Maak een foto en deel hem direct in Discord.",
    siteName: "DAC Fotobooth",
    locale: "nl_NL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DAC Fotobooth",
    description: "Maak een foto en deel hem direct in Discord.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DAC Fotobooth",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
}

const RootLayout = ({ children }) => (
  <html lang="nl" className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}>
    <body className="h-full overflow-hidden bg-ground text-ink">
      <ServiceWorkerRegistrar />
      {children}
    </body>
  </html>
)

export default RootLayout