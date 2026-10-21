export const place = "Tristán Suárez, partido de Ezeiza"
export const hectares = "27 hectáreas"

export const nav = [
  { href: "/#actividades", id: "actividades", label: "Actividades" },
  { href: "/#como-reservar", id: "como-reservar", label: "Reservas" },
  { href: "/#mas-informacion", id: "mas-informacion", label: "Más información" },
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
