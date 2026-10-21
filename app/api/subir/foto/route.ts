import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { humanizar } from "@/lib/errores"
import { anotar } from "@/lib/panel/actividad"
import { puedeVer } from "@/lib/panel/roles"
import { guardarFoto, MAXIMO_DE_SUBIDA } from "@/lib/subidas"

export async function POST(request: Request) {
  const sesion = await auth().api.getSession({ headers: await headers() })
  if (!sesion || !puedeVer(sesion.user.role, "sitio")) {
    return Response.json({ ok: false, error: "Tu sesión venció o no tenés permiso para subir fotos." }, { status: 403 })
  }
  // formData() lee todo el cuerpo en memoria: sin largo declarado, o con uno excesivo, no se lee.
  const largo = Number(request.headers.get("content-length"))
  if (!largo || largo > MAXIMO_DE_SUBIDA) {
    return Response.json({ ok: false, error: "La foto pesa más de 15 MB. Achicala o mandala por WhatsApp y la subimos nosotros." }, { status: 413 })
  }
  try {
    const archivo = (await request.formData()).get("foto")
    if (!(archivo instanceof File)) return Response.json({ ok: false, error: "No llegó ninguna foto. Elegila de nuevo." }, { status: 400 })
    const src = await guardarFoto(Buffer.from(await archivo.arrayBuffer()))
    await anotar(sesion, { seccion: "sitio", accion: "subió una foto", detalle: `${archivo.name.slice(0, 80)} → ${src}` })
    return Response.json({ ok: true, src })
  } catch (error) {
    console.error(`[subir foto] ${error instanceof Error ? error.message.slice(0, 200) : String(error)}`)
    return Response.json(humanizar(error), { status: 400 })
  }
}
