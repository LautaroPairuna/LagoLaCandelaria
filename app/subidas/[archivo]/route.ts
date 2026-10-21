import { leerSubida } from "@/lib/subidas"

export async function GET(_request: Request, { params }: RouteContext<"/subidas/[archivo]">) {
  const { archivo } = await params
  const subida = await leerSubida(archivo)
  if (!subida) return new Response("No encontramos esa foto.", { status: 404 })
  return new Response(new Uint8Array(subida.contenido), {
    headers: {
      "Content-Type": subida.tipo,
      // Cada foto subida tiene un nombre nuevo: nunca cambia en la misma dirección.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
