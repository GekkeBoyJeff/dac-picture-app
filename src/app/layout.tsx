import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DAC Photo Booth",
  description: "Maak een foto en deel het op Discord!",
  manifest: "./manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Photo Booth",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={`${geistSans.variable} h-full antialiased`}>
      <body className="h-full bg-black text-white overflow-hidden">
        <ServiceWorkerRegistrar />
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
