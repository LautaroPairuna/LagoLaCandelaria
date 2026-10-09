import { headers } from "next/headers"

import { periodoDeCaja } from "@/app/panel/caja/periodo"
import { auth } from "@/lib/auth"
import { cajaEnCsv, esFiltroDeCajon, esSeccion, libroDeCaja } from "@/lib/panel/caja"
import { secciones, type Seccion } from "@/lib/panel/libro-caja"
import { puedeVer } from "@/lib/panel/roles"
import { hoyEnElPredio } from "@/lib/predio/fechas"

const hora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" })

export async function GET(request: Request) {
  const url = new URL(request.url)
  const pedida = url.searchParams.get("seccion") ?? undefined
  const seccion: Seccion | null = esSeccion(pedida) ? pedida : null
  const sesion = await auth().api.getSession({ headers: await headers() })
  // La caja de cada local la baja también su encargado; las demás, solo la caja.
  const permitido =
    sesion && (puedeVer(sesion.user.role, "caja") || (seccion === "restaurante" && puedeVer(sesion.user.role, "restaurante")) || (seccion === "bar" && puedeVer(sesion.user.role, "bar")))
  if (!permitido) return new Response("Tu sesión venció o no tenés permiso para ver esta caja.", { status: 403 })

  const { desde, hasta } = periodoDeCaja(url.searchParams.get("desde") ?? undefined, url.searchParams.get("hasta") ?? undefined, hoyEnElPredio())
  const pedido = url.searchParams.get("cajon") ?? undefined
  const cajon = esFiltroDeCajon(pedido) ? pedido : "todos"
  // La caja de una sección incluye solo sus renglones; la general, todo (filtrado si se pidió una sección).
  const incluidas: Seccion[] = seccion && seccion !== "predio" && !url.searchParams.has("general") ? [seccion] : secciones
  const { renglones, resumen } = await libroDeCaja(desde, hasta, incluidas)
  const visibles = renglones.filter((renglon) => (cajon === "todos" || renglon.cajon === cajon) && (!seccion || renglon.seccion === seccion))
  const csv = cajaEnCsv(visibles, resumen, hasta, (fecha) => hora.format(fecha))
  const nombre = ["caja", seccion ?? "general", desde, ...(hasta === desde ? [] : ["al", hasta]), ...(cajon === "todos" ? [] : [cajon.toLowerCase()])].join("-")
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombre}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
