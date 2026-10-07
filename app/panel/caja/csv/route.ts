import { headers } from "next/headers"

import { periodoDeCaja } from "@/app/panel/caja/periodo"
import { auth } from "@/lib/auth"
import { cajaEnCsv, esFiltroDeCajon, libroDeCaja } from "@/lib/panel/caja"
import { puedeVer } from "@/lib/panel/roles"
import { hoyEnElPredio } from "@/lib/predio/fechas"

const hora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" })

export async function GET(request: Request) {
  const sesion = await auth().api.getSession({ headers: await headers() })
  if (!sesion || !puedeVer(sesion.user.role, "caja")) {
    return new Response("Tu sesión venció o no tenés permiso para ver la caja.", { status: 403 })
  }
  const url = new URL(request.url)
  const { desde, hasta } = periodoDeCaja(url.searchParams.get("desde") ?? undefined, url.searchParams.get("hasta") ?? undefined, hoyEnElPredio())
  const pedido = url.searchParams.get("cajon") ?? undefined
  const cajon = esFiltroDeCajon(pedido) ? pedido : "todos"
  const { renglones, resumen } = await libroDeCaja(desde, hasta)
  const visibles = cajon === "todos" ? renglones : renglones.filter((renglon) => renglon.cajon === cajon)
  const csv = cajaEnCsv(visibles, resumen, hasta, (fecha) => hora.format(fecha))
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="caja-${desde}${hasta === desde ? "" : `-al-${hasta}`}${cajon === "todos" ? "" : `-${cajon.toLowerCase()}`}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
