import "server-only"

import { execFile } from "node:child_process"
import { randomBytes } from "node:crypto"
import { createWriteStream } from "node:fs"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { Readable, Transform } from "node:stream"
import { pipeline } from "node:stream/promises"
import { promisify } from "node:util"

import ffmpeg from "ffmpeg-static"

import { ErrorHumano } from "@/lib/errores"
import { carpetaDeSubidas, guardarFoto } from "@/lib/subidas"

/// Los videos de fondo que se suben desde el panel. Se guardan al disco a medida que llegan
/// (no en memoria) y ffmpeg los deja como los del sitio: 720p, 25 cuadros, sin audio y
/// alrededor de 1,5 Mbps, con el primer cuadro como póster. Se procesan de a uno.

export const MAXIMO_DE_VIDEO = 300 * 1024 * 1024
/// Un fondo que se repite no necesita más; lo que sobra se corta.
export const SEGUNDOS_MAXIMOS = 60

const correr = promisify(execFile)
const idValido = /^[a-z0-9]{16}$/

export type EstadoDeVideo = { estado: "procesando" } | { estado: "listo"; src: string; poster: string } | { estado: "error"; error: string }

function carpeta() {
  const destino = carpetaDeSubidas()
  if (!destino) throw new ErrorHumano("Falta configurar la carpeta de archivos del servidor (UPLOADS_DIR). Avisale a quien mantiene el sitio.")
  return destino
}

const archivo = (destino: string, nombre: string) => path.join(/*turbopackIgnore: true*/ destino, nombre)

async function anotarEstado(destino: string, id: string, estado: EstadoDeVideo) {
  await writeFile(/*turbopackIgnore: true*/ archivo(destino, `${id}.estado.json`), JSON.stringify(estado))
}

export async function estadoDeVideo(id: string): Promise<EstadoDeVideo | null> {
  const destino = carpetaDeSubidas()
  if (!destino || !idValido.test(id)) return null
  try {
    return JSON.parse(await readFile(/*turbopackIgnore: true*/ archivo(destino, `${id}.estado.json`), "utf8")) as EstadoDeVideo
  } catch {
    return null
  }
}

/// Guarda el cuerpo del pedido tal como llega y corta si pasa del máximo, aunque no
/// haya declarado su largo.
export async function recibirVideo(cuerpo: ReadableStream<Uint8Array>) {
  const destino = carpeta()
  await mkdir(/*turbopackIgnore: true*/ destino, { recursive: true })
  const id = randomBytes(8).toString("hex")
  const original = archivo(destino, `${id}.original`)
  let recibidos = 0
  const contador = new Transform({
    transform(pedazo: Buffer, _codificacion, listo) {
      recibidos += pedazo.length
      listo(recibidos > MAXIMO_DE_VIDEO ? new ErrorHumano("El video pesa más de 300 MB. Recortalo o bajale la calidad y probá de nuevo.") : null, pedazo)
    },
  })
  try {
    await pipeline(Readable.fromWeb(cuerpo as Parameters<typeof Readable.fromWeb>[0]), contador, createWriteStream(/*turbopackIgnore: true*/ original))
  } catch (error) {
    await rm(/*turbopackIgnore: true*/ original, { force: true })
    throw error
  }
  await anotarEstado(destino, id, { estado: "procesando" })
  cola = cola.then(() => procesar(destino, id))
  return id
}

let cola: Promise<void> = Promise.resolve()

async function procesar(destino: string, id: string) {
  const original = archivo(destino, `${id}.original`)
  const salida = archivo(destino, `${id}.mp4`)
  const cuadro = archivo(destino, `${id}.poster.jpg`)
  try {
    if (!ffmpeg) throw new Error("ffmpeg-static no trae binario para esta plataforma")
    // El lado más largo a 1280 como mucho; dos hilos para no tapar al resto del VPS.
    await correr(
      ffmpeg,
      [
        "-hide_banner", "-nostdin", "-y", "-i", original,
        "-t", String(SEGUNDOS_MAXIMOS), "-an",
        "-vf", "scale='if(gt(iw,ih),min(1280,iw),-2)':'if(gt(iw,ih),-2,min(1280,ih))',fps=25",
        "-c:v", "libx264", "-preset", "medium", "-crf", "27", "-maxrate", "1800k", "-bufsize", "3600k",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-threads", "2",
        salida,
      ],
      { timeout: 15 * 60 * 1000 },
    )
    await correr(ffmpeg, ["-hide_banner", "-nostdin", "-y", "-i", salida, "-frames:v", "1", "-q:v", "2", cuadro], { timeout: 60 * 1000 })
    const poster = await guardarFoto(await readFile(/*turbopackIgnore: true*/ cuadro))
    await anotarEstado(destino, id, { estado: "listo", src: `/subidas/${id}.mp4`, poster })
  } catch (error) {
    console.error(`[video ${id}] ${error instanceof Error ? error.message.slice(0, 400) : String(error)}`)
    await rm(/*turbopackIgnore: true*/ salida, { force: true })
    const mensaje =
      error instanceof ErrorHumano ? error.message : "No pudimos procesar ese video. Probá con un MP4 o MOV común; si sigue fallando, mandalo por WhatsApp y lo subimos nosotros."
    await anotarEstado(destino, id, { estado: "error", error: mensaje })
  } finally {
    await rm(/*turbopackIgnore: true*/ original, { force: true })
    await rm(/*turbopackIgnore: true*/ cuadro, { force: true })
  }
}
