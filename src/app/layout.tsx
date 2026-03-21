import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Photo Booth",
  description: "Maak een foto en deel het op Discord!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={`${geistSans.variable} h-full antialiased`}>
      <body className="h-full bg-black text-white overflow-hidden">
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
