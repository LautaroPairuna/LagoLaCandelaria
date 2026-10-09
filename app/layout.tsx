import type { Metadata, Viewport } from "next"
import { Fraunces, Outfit } from "next/font/google"

import { AppToaster } from "@/components/app-toaster"
import { NOMBRE_DEL_SITIO, seoDelInicio } from "@/lib/seo"
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

export const metadata: Metadata = {
  metadataBase: new URL(urlSitio),
  title: {
    default: seoDelInicio.titulo,
    template: `%s · ${NOMBRE_DEL_SITIO}`,
  },
  description: seoDelInicio.descripcion,
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: NOMBRE_DEL_SITIO,
    title: seoDelInicio.titulo,
    description: seoDelInicio.descripcion,
  },
  twitter: { card: "summary_large_image", title: seoDelInicio.titulo, description: seoDelInicio.descripcion },
}

export const viewport: Viewport = {
  themeColor: "#FBF5EA",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      data-scroll-behavior="smooth"
      className={`${outfit.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <AppToaster />
      </body>
    </html>
  )
}
