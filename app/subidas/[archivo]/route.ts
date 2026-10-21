import { Readable } from "node:stream"

import { abrirSubida } from "@/lib/subidas"

export async function GET(request: Request, { params }: RouteContext<"/subidas/[archivo]">) {
  const { archivo } = await params
  const subida = await abrirSubida(archivo, request.headers.get("range"))
  if (!subida) return new Response("No encontramos ese archivo.", { status: 404 })
  const comunes = {
    "Content-Type": subida.tipo,
    "Accept-Ranges": "bytes",
    // Cada archivo subido tiene un nombre nuevo: nunca cambia en la misma dirección.
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  }
  if ("fuera" in subida) return new Response(null, { status: 416, headers: { ...comunes, "Content-Range": `bytes */${subida.total}` } })
  const cuerpo = Readable.toWeb(subida.flujo) as ReadableStream
  if (subida.inicio !== undefined && subida.fin !== undefined) {
    return new Response(cuerpo, {
      status: 206,
      headers: { ...comunes, "Content-Range": `bytes ${subida.inicio}-${subida.fin}/${subida.total}`, "Content-Length": String(subida.fin - subida.inicio + 1) },
    })
  }
  return new Response(cuerpo, { headers: { ...comunes, "Content-Length": String(subida.total) } })
}
