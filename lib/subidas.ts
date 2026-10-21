import "server-only"

import { randomBytes } from "node:crypto"
import { createReadStream } from "node:fs"
import { mkdir, stat } from "node:fs/promises"
import path from "node:path"

import sharp from "sharp"

import { ErrorHumano } from "@/lib/errores"
import { ANCHO_MAXIMO_SUBIDO, anchoDeRespaldo, anchosPara, srcDeSubida } from "@/lib/fotos"

/// Las fotos que se suben desde el panel. En producción van a la carpeta montada del VPS
/// (UPLOADS_DIR, el Mount Path del bind mount): dentro del contenedor se perderían en cada deploy.

export const MAXIMO_DE_SUBIDA = 15 * 1024 * 1024
const formatosAceptados = new Set(["jpeg", "png", "webp", "avif", "heif"])

sharp.concurrency(1)
sharp.cache(false)

export function carpetaDeSubidas() {
  const configurada = process.env.UPLOADS_DIR
  if (configurada) return configurada
  if (process.env.NODE_ENV === "production") return null
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "subidas")
}

export async function guardarFoto(archivo: Buffer) {
  const carpeta = carpetaDeSubidas()
  if (!carpeta) throw new ErrorHumano("Falta configurar la carpeta de fotos del servidor (UPLOADS_DIR). Avisale a quien mantiene el sitio.")

  const meta = await sharp(archivo).metadata().catch(() => null)
  if (!meta?.format || !formatosAceptados.has(meta.format) || !meta.width || !meta.height) {
    throw new ErrorHumano("Ese archivo no es una foto que podamos usar. Subí un JPG, PNG o WEBP.")
  }
  const girada = (meta.orientation ?? 1) >= 5
  const anchoOriginal = girada ? meta.height : meta.width
  const altoOriginal = girada ? meta.width : meta.height
  if (anchoOriginal < 480) throw new ErrorHumano("La foto es muy chica: tiene que tener al menos 480 píxeles de ancho.")

  const ancho = Math.min(anchoOriginal, ANCHO_MAXIMO_SUBIDO)
  const alto = Math.round((altoOriginal * ancho) / anchoOriginal)
  const id = randomBytes(8).toString("hex")
  const anchos = anchosPara(ancho)

  await mkdir(/*turbopackIgnore: true*/ carpeta, { recursive: true })
  const destino = (nombre: string) => path.join(/*turbopackIgnore: true*/ carpeta, nombre)
  for (const variante of anchos) {
    const base = sharp(archivo).rotate().resize({ width: variante })
    await base.clone().avif({ quality: 55, effort: 4 }).toFile(destino(`${id}-${variante}.avif`))
    await base.clone().webp({ quality: 74 }).toFile(destino(`${id}-${variante}.webp`))
  }
  await sharp(archivo)
    .rotate()
    .resize({ width: anchoDeRespaldo(anchos) })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(destino(`${id}-${anchoDeRespaldo(anchos)}.jpg`))

  return srcDeSubida(id, ancho, alto)
}

const archivoValido = /^[a-z0-9]{16}(-\d{2,4}\.(avif|webp|jpg)|\.mp4)$/
const tipos = { avif: "image/avif", webp: "image/webp", jpg: "image/jpeg", mp4: "video/mp4" } as const

/// Abre un archivo subido para servirlo, entero o el tramo pedido (los navegadores piden
/// los videos de a pedazos con Range, y Safari no los reproduce sin eso).
export async function abrirSubida(nombre: string, rango: string | null) {
  const carpeta = carpetaDeSubidas()
  if (!carpeta || !archivoValido.test(nombre)) return null
  const ruta = path.join(/*turbopackIgnore: true*/ carpeta, nombre)
  const datos = await stat(/*turbopackIgnore: true*/ ruta).catch(() => null)
  if (!datos?.isFile()) return null
  const tipo = tipos[nombre.split(".").pop() as keyof typeof tipos]
  const total = datos.size
  const pedido = rango ? /^bytes=(\d*)-(\d*)$/.exec(rango) : null
  if (pedido && (pedido[1] || pedido[2])) {
    const inicio = pedido[1] ? Number(pedido[1]) : Math.max(total - Number(pedido[2]), 0)
    const fin = pedido[1] && pedido[2] ? Math.min(Number(pedido[2]), total - 1) : total - 1
    if (inicio > fin || inicio >= total) return { tipo, total, fuera: true as const }
    return { tipo, total, inicio, fin, flujo: createReadStream(/*turbopackIgnore: true*/ ruta, { start: inicio, end: fin }) }
  }
  return { tipo, total, flujo: createReadStream(/*turbopackIgnore: true*/ ruta) }
}
