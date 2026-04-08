import { Geist } from "next/font/google"
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar"
import { assetPath } from "@/lib/config/basePath"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
  metadataBase: new URL("https://github.com/GekkeBoyJeff/dac-picture-app"),
  title: "DAC Fotobooth",
  description: "Maak foto's op anime conventies met de DAC Fotobooth",
  manifest: assetPath("/manifest.json"),
  icons: {
    icon: assetPath("/overlays/logo.png"),
    apple: assetPath("/overlays/logo.png"),
  },
  openGraph: {
    title: "DAC Fotobooth",
    description: "Maak foto's op anime conventies met de DAC Fotobooth",
    images: [
      {
        url: "/overlays/logo.png",
        width: 512,
        height: 512,
        alt: "DAC Fotobooth logo",
      },
    ],
    siteName: "DAC Fotobooth",
    locale: "nl_NL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DAC Fotobooth",
    description: "Maak foto's op anime conventies met de DAC Fotobooth",
    images: ["/overlays/logo.png"],
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "DAC Fotobooth",
  applicationCategory: "EntertainmentApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  description: "Interactieve fotobooth voor anime conventies",
  inLanguage: "nl",
}

const RootLayout = ({ children }) => (
  <html lang="nl" className={`${geistSans.variable} h-full antialiased`}>
    <body className="h-full bg-black text-white overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ServiceWorkerRegistrar />
      {children}
    </body>
  </html>
)

export default RootLayout