import { headers } from "next/headers"

import { periodoDeCaja } from "@/app/panel/caja/periodo"
import { auth } from "@/lib/auth"
import { seccionesDeActividad } from "@/lib/panel/actividad"
import { diaDelPredio, esSeccionDeActividad, registroDeActividad } from "@/lib/panel/registro"
import { puedeVer } from "@/lib/panel/roles"
import { hoyEnElPredio } from "@/lib/predio/fechas"

const hora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" })

function celda(valor: string | number) {
  const texto = String(valor)
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

export async function GET(request: Request) {
  const sesion = await auth().api.getSession({ headers: await headers() })
  if (!sesion || !puedeVer(sesion.user.role, "general")) return new Response("Tu sesión venció o no tenés permiso para ver la actividad.", { status: 403 })
  const url = new URL(request.url)
  const { desde, hasta } = periodoDeCaja(url.searchParams.get("desde") ?? undefined, url.searchParams.get("hasta") ?? undefined, hoyEnElPredio())
  const seccion = url.searchParams.get("seccion") ?? undefined
  const { filas } = await registroDeActividad(
    { desde, hasta, userId: url.searchParams.get("usuario") || undefined, seccion: esSeccionDeActividad(seccion) ? seccion : undefined, texto: url.searchParams.get("q")?.trim().slice(0, 60) || undefined },
    20_000,
  )
  const lineas = [
    ["Fecha", "Hora", "Persona", "Correo", "Rol", "Sección", "Acción", "Detalle", "Reserva", "Monto"],
    ...filas.map((fila) => [
      diaDelPredio(fila.creadoEn).split("-").reverse().join("/"),
      hora.format(fila.creadoEn),
      fila.usuario,
      fila.email ?? "",
      fila.roles.join(", "),
      seccionesDeActividad[fila.seccion],
      fila.accion,
      fila.detalle,
      fila.reservaId ?? "",
      fila.monto ?? "",
    ]),
  ]
  const csv = `﻿${lineas.map((linea) => linea.map(celda).join(";")).join("\r\n")}\r\n`
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="actividad-${desde}${hasta === desde ? "" : `-al-${hasta}`}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
