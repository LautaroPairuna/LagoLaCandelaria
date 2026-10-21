import { telefonoDelPredio } from "@/lib/contenido/campos"
import type { Contacto } from "@/lib/contenido/secciones"

/// Lo que el sitio arma a partir de los datos de contacto: enlaces, canales y teléfonos.

export type IdDeCanal = "whatsapp" | "phone" | "mail" | "facebook" | "instagram" | "youtube" | "tiktok"
export type Canal = { id: IdDeCanal; label: string; detail: string; href: string }

export function enlaceWhatsapp(numero: string, mensaje?: string) {
  const telefono = telefonoDelPredio(numero)
  const base = `https://wa.me/${telefono?.whatsapp ?? numero.replace(/\D/g, "")}`
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base
}

function tel(numero: string) {
  return `tel:${telefonoDelPredio(numero)?.e164 ?? numero.replace(/\D/g, "")}`
}

export function telefonosDe(contacto: Contacto) {
  return [
    { label: contacto.whatsapp, href: tel(contacto.whatsapp) },
    { label: contacto.telefonoFijo, href: tel(contacto.telefonoFijo) },
  ]
}

export function canalesDe(contacto: Contacto): Canal[] {
  return [
    { id: "whatsapp", label: "WhatsApp", detail: contacto.whatsapp, href: enlaceWhatsapp(contacto.whatsapp) },
    { id: "mail", label: "Gmail", detail: contacto.email, href: `mailto:${contacto.email}` },
    { id: "facebook", label: "Facebook", detail: `/${contacto.facebook}`, href: `https://www.facebook.com/${contacto.facebook}` },
    { id: "instagram", label: "Instagram", detail: `@${contacto.instagram}`, href: `https://www.instagram.com/${contacto.instagram}/` },
    { id: "youtube", label: "YouTube", detail: `@${contacto.youtube}`, href: `https://www.youtube.com/@${contacto.youtube}` },
    { id: "phone", label: "Teléfono fijo", detail: contacto.telefonoFijo, href: tel(contacto.telefonoFijo) },
    { id: "tiktok", label: "TikTok", detail: `@${contacto.tiktok}`, href: `https://www.tiktok.com/@${contacto.tiktok}` },
  ]
}
