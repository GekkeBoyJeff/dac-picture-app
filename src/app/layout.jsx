import { Geist } from "next/font/google";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/** @type {import('next').Viewport} */
export const viewport = {
  themeColor: "#e6c189",
  colorScheme: "dark",
};

/** @type {import('next').Metadata} */
export const metadata = {
  title: "DAC Photo Booth",
  description: "Take a photo and share it on Discord!",
  manifest: "./manifest.json",
  icons: {
    apple: "/overlays/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Photo Booth",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl" className={`${geistSans.variable} h-full antialiased`}>
      <body className="h-full bg-black text-white overflow-hidden">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
