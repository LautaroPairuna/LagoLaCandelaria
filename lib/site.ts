export const place = "Tristán Suárez, partido de Ezeiza"
export const hectares = "27 hectáreas"

export const phones = [
  { label: "11 3009-1020", href: "tel:+541130091020" },
  { label: "4851-1060", href: "tel:+541148511060" },
] as const

export const nav = [
  { href: "/#actividades", id: "actividades", label: "Actividades" },
  { href: "/#estadia", id: "estadia", label: "Estadía" },
  { href: "/#como-reservar", id: "como-reservar", label: "¿Cómo reservar?" },
  { href: "/#nosotros", id: "nosotros", label: "Nosotros" },
] as const

export const pages = [
  { href: "/restaurante", label: "Restaurante" },
  { href: "/grupos", label: "Grupos" },
] as const

export const channels = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    detail: "11 3009-1020",
    href: "https://wa.me/5491130091020",
  },
  {
    id: "mail",
    label: "Gmail",
    detail: "lagolacandelaria@gmail.com",
    href: "mailto:lagolacandelaria@gmail.com",
  },
  {
    id: "facebook",
    label: "Facebook",
    detail: "/lagolacandelaria",
    href: "https://www.facebook.com/lagolacandelaria",
  },
  {
    id: "instagram",
    label: "Instagram",
    detail: "@lagolacandelaria",
    href: "https://www.instagram.com/lagolacandelaria/",
  },
  {
    id: "youtube",
    label: "YouTube",
    detail: "@lagolacandelaria1482",
    href: "https://www.youtube.com/@lagolacandelaria1482",
  },
  {
    id: "phone",
    label: "Teléfono fijo",
    detail: "4851-1060",
    href: "tel:+541148511060",
  },
  {
    id: "tiktok",
    label: "TikTok",
    detail: "@lagolacandelaria",
    href: "https://www.tiktok.com/@lagolacandelaria",
  },
] as const

export const mapUrl =
  "https://www.google.com/maps/place/Lago+La+Candelaria/@-34.8495886,-58.6060408,17z/data=!3m1!4b1!4m6!3m5!1s0x95bcdb11cd937a39:0x5fa0bb17951d6f48!8m2!3d-34.8495886!4d-58.6060408!16s%2Fg%2F11nrrb8g4y"

export const mapPoint = {
  lat: -34.8495886,
  lng: -58.6060408,
} as const

export const googleRating = {
  score: 4.7,
  count: 738,
} as const

export const visitTypes = [
  { value: "familia", label: "Finde en familia" },
  { value: "campamento", label: "Campamento estudiantil" },
  { value: "egresados", label: "Viaje de egresados" },
  { value: "educativa", label: "Salida educativa" },
  { value: "bungalows", label: "Bungalows" },
  { value: "restaurante", label: "Restaurante o sector" },
  { value: "otra", label: "Otra consulta" },
] as const

export type VisitType = (typeof visitTypes)[number]["value"]

export const WHATSAPP_DEL_PREDIO = "5491130091020"

export function enlaceWhatsappDelPredio(mensaje: string) {
  return `https://wa.me/${WHATSAPP_DEL_PREDIO}?text=${encodeURIComponent(mensaje)}`
}
