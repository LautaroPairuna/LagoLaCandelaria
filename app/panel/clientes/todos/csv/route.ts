import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { celda } from "@/lib/panel/caja"
import { puedeVer } from "@/lib/panel/roles"
import { clientesParaExportar } from "@/lib/panel/whatsapp"

/// La base de clientes en CSV con punto y coma, que Excel en español abre sin asistente.
export async function GET(request: Request) {
  const sesion = await auth().api.getSession({ headers: await headers() })
  if (!sesion || !puedeVer(sesion.user.role, "clientes")) {
    return new Response("Tu sesión venció o no tenés permiso para ver los clientes.", { status: 403 })
  }
  const texto = (new URL(request.url).searchParams.get("q") ?? "").slice(0, 60)
  const clientes = await clientesParaExportar(texto)
  const tabla: (string | number)[][] = [
    ["Apellido", "Nombre", "DNI", "Teléfono", "Correo", "Reservas", "Última reserva"],
    ...clientes.map((cliente) => [cliente.apellido, cliente.nombre, cliente.dni, cliente.telefono, cliente.email, cliente.reservas, cliente.ultima]),
  ]
  return new Response(`﻿${tabla.map((fila) => fila.map(celda).join(";")).join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clientes.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
