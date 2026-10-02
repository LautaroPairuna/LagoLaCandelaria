import generadas from "@/lib/fotos.generadas.json"

export type FotoGenerada = {
  ancho: number
  alto: number
  anchos: number[]
  base: string
  respaldo: string
}

const catalogo: Record<string, FotoGenerada | undefined> = generadas

export function fotoGenerada(src: string) {
  const foto = catalogo[src]
  if (!foto) throw new Error(`La foto ${src} no está en fotos/. Agregala y corré npm run fotos.`)
  return foto
}

export function fotoUrl(src: string, ancho: number, formato: "avif" | "webp" = "webp") {
  const foto = fotoGenerada(src)
  const elegido = foto.anchos.find((disponible) => disponible >= ancho) ?? foto.anchos.at(-1)
  return `${foto.base}-${elegido}.${formato}`
}
