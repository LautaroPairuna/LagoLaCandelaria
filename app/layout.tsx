import type { Metadata, Viewport } from "next"
import { Fraunces, Outfit } from "next/font/google"

import { AppToaster } from "@/components/app-toaster"
import { DatosEstructurados } from "@/components/datos-estructurados"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { urlSitio } from "@/lib/url-sitio"

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

const descripcion =
  "Predio recreativo en Tristán Suárez. Canotaje, tirolesa, restaurante, bungalows y campamentos para familias y estudiantes. La visita se reserva."

export const metadata: Metadata = {
  metadataBase: new URL(urlSitio),
  title: {
    default: "Lago La Candelaria",
    template: "%s · Lago La Candelaria",
  },
  description: descripcion,
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Lago La Candelaria",
    title: "Lago La Candelaria",
    description: descripcion,
  },
  twitter: { card: "summary_large_image" },
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
        <DatosEstructurados />
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <AppToaster />
      </body>
    </html>
  )
}
