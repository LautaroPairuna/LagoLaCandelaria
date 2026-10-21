import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { planillaDelDia, planillaEnCsv } from "@/lib/panel/planilla"
import { puedeVer } from "@/lib/panel/roles"
import { esFechaIso, hoyEnElPredio } from "@/lib/predio/fechas"

export async function GET(request: Request) {
  const sesion = await auth().api.getSession({ headers: await headers() })
  if (!sesion || !(puedeVer(sesion.user.role, "reservas") || puedeVer(sesion.user.role, "puerta"))) {
    return new Response("Tu sesión venció o no tenés permiso para ver la planilla.", { status: 403 })
  }
  const pedida = new URL(request.url).searchParams.get("fecha")
  const fecha = pedida && esFechaIso(pedida) ? pedida : hoyEnElPredio()
  const csv = planillaEnCsv(await planillaDelDia(fecha))
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="planilla-${fecha}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
