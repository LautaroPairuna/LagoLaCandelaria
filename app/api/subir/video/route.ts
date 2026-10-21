import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { humanizar } from "@/lib/errores"
import { anotar } from "@/lib/panel/actividad"
import { puedeVer } from "@/lib/panel/roles"
import { estadoDeVideo, MAXIMO_DE_VIDEO, recibirVideo } from "@/lib/videos"

async function permitido() {
  const sesion = await auth().api.getSession({ headers: await headers() })
  return sesion && puedeVer(sesion.user.role, "sitio") ? sesion : null
}

const sinPermiso = () => Response.json({ ok: false, error: "Tu sesión venció o no tenés permiso para subir videos." }, { status: 403 })

/// El video llega crudo en el cuerpo (no como formulario) y se guarda a medida que llega.
export async function POST(request: Request) {
  const sesion = await permitido()
  if (!sesion) return sinPermiso()
  const largo = Number(request.headers.get("content-length"))
  if (largo > MAXIMO_DE_VIDEO) return Response.json({ ok: false, error: "El video pesa más de 300 MB. Recortalo o bajale la calidad y probá de nuevo." }, { status: 413 })
  if (!request.body || !(request.headers.get("content-type") ?? "").startsWith("video/")) {
    return Response.json({ ok: false, error: "Ese archivo no es un video. Subí un MP4 o MOV." }, { status: 400 })
  }
  try {
    const id = await recibirVideo(request.body)
    const nombre = decodeURIComponent(request.headers.get("x-nombre") ?? "").slice(0, 80)
    await anotar(sesion, { seccion: "sitio", accion: "subió un video", detalle: `${nombre || "video"} → /subidas/${id}.mp4` })
    return Response.json({ ok: true, id })
  } catch (error) {
    console.error(`[subir video] ${error instanceof Error ? error.message.slice(0, 200) : String(error)}`)
    return Response.json(humanizar(error), { status: 400 })
  }
}

export async function GET(request: Request) {
  if (!(await permitido())) return sinPermiso()
  const estado = await estadoDeVideo(new URL(request.url).searchParams.get("id") ?? "")
  if (!estado) return Response.json({ ok: false, error: "No encontramos ese video. Subilo de nuevo." }, { status: 404 })
  return Response.json({ ok: true, ...estado }, { headers: { "Cache-Control": "no-store" } })
}
