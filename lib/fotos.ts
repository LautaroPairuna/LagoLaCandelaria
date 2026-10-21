import generadas from "@/lib/fotos.generadas.json"

export type FotoGenerada = {
  ancho: number
  alto: number
  anchos: number[]
  base: string
  respaldo: string
}

const catalogo: Record<string, FotoGenerada | undefined> = generadas

/// Los mismos anchos que genera `npm run fotos`, para las fotos que se suben desde el panel.
export const ANCHOS_DE_FOTO = [480, 768, 1024, 1600, 1920]
export const ANCHO_MAXIMO_SUBIDO = 2560
const ANCHO_RESPALDO = 1024

/// Una foto subida se nombra con su tamaño ("/subidas/abc...-1920x1280"): de ahí salen sus
/// variantes sin consultar nada más.
const subida = /^\/subidas\/([a-z0-9]{16})-(\d{2,4})x(\d{2,5})$/

export function anchosPara(ancho: number) {
  return [...new Set([...ANCHOS_DE_FOTO.filter((disponible) => disponible < ancho), ancho])]
}

export function anchoDeRespaldo(anchos: number[]) {
  return anchos.filter((ancho) => ancho <= ANCHO_RESPALDO).at(-1) ?? anchos[0]
}

export function srcDeSubida(id: string, ancho: number, alto: number) {
  return `/subidas/${id}-${ancho}x${alto}`
}

function fotoSubida(src: string): FotoGenerada | undefined {
  const partes = subida.exec(src)
  if (!partes) return undefined
  const [, id, ancho, alto] = partes
  const anchos = anchosPara(Number(ancho))
  return { ancho: Number(ancho), alto: Number(alto), anchos, base: `/subidas/${id}`, respaldo: `/subidas/${id}-${anchoDeRespaldo(anchos)}.jpg` }
}

export function esFotoValida(src: string) {
  return Boolean(catalogo[src] ?? fotoSubida(src))
}

/// Las fotos que ya trae el sitio, para elegirlas en el panel sin subir nada.
export function fotosDelSitio() {
  return Object.keys(catalogo)
}

export function fotoGenerada(src: string) {
  const foto = catalogo[src] ?? fotoSubida(src)
  if (!foto) throw new Error(`La foto ${src} no está en fotos/. Agregala y corré npm run fotos.`)
  return foto
}

export function fotoUrl(src: string, ancho: number, formato: "avif" | "webp" = "webp") {
  const foto = fotoGenerada(src)
  const elegido = foto.anchos.find((disponible) => disponible >= ancho) ?? foto.anchos.at(-1)
  return `${foto.base}-${elegido}.${formato}`
}
