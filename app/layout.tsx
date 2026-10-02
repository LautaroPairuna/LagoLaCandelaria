import type { Metadata, Viewport } from "next"
import { Fraunces, Outfit } from "next/font/google"

import { AppToaster } from "@/components/app-toaster"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

import "./globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  variable: "--font-fraunces",
})

export const metadata: Metadata = {
  title: {
    default: "Lago La Candelaria",
    template: "%s · Lago La Candelaria",
  },
  description:
    "Predio recreativo en Tristán Suárez. Canotaje, tirolesa, restaurante, bungalows y campamentos para familias y estudiantes. La visita se reserva.",
}

export const viewport: Viewport = {
  themeColor: "#FBF5EA",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <AppToaster />
      </body>
    </html>
  )
}
