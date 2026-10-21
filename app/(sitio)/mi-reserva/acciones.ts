"use server"

import { headers } from "next/headers"
import { z } from "zod"

import { accion, exigir, mensajesDelSitio, type Resultado } from "@/lib/errores"
import { limiteAlcanzado, registrarUso } from "@/lib/limite"
import { db } from "@/lib/prisma"
import { ticketDeReserva, type TicketDatos } from "@/lib/reservas"

const INTENTOS = 8
const VENTANA_MS = 15 * 60 * 1000

const pedido = z.object({
  identificador: z
    .string()
    .trim()
    .toUpperCase()
    .transform((valor) => valor.replace(/\s/g, ""))
    .refine(
      (valor) => /^\d{7,8}$/.test(valor) || /^(?:LC-?)?[A-Z0-9]{6}$/.test(valor),
      "Escribí un DNI de 7 u 8 números o un código como LC-AB12CD.",
    ),
})

/// Busca por uno de los dos identificadores admitidos. Los intentos están limitados por
/// IP para evitar que se puedan recorrer códigos o documentos en forma automatizada.
export async function buscarMiReserva(datos: z.input<typeof pedido>): Promise<Resultado<{ token: string; ticket: TicketDatos }>> {
  return accion(
    "buscarMiReserva",
    async () => {
      const cabeceras = await headers()
      const ip = cabeceras.get("cf-connecting-ip") ?? cabeceras.get("x-real-ip") ?? cabeceras.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "desconocida"
      const clave = `mi-reserva:${ip}`
      exigir(!limiteAlcanzado(clave, INTENTOS, VENTANA_MS), "Probaste muchas veces. Esperá unos minutos o escribinos por WhatsApp con tu código.")
      const { identificador } = pedido.parse(datos)
      const esDni = /^\d{7,8}$/.test(identificador)
      const codigo = esDni
        ? null
        : identificador.startsWith("LC-")
          ? identificador
          : `LC-${identificador.replace(/^LC/, "")}`
      const reserva = esDni
        ? await db().reserva.findFirst({
            where: { cliente: { dni: identificador } },
            orderBy: [{ desde: "desc" }, { creadaEn: "desc" }],
            select: { token: true },
          })
        : await db().reserva.findUnique({
            where: { codigo: codigo! },
            select: { token: true },
          })
      if (!reserva) {
        registrarUso(clave, VENTANA_MS)
        exigir(false, "No encontramos una reserva con ese código o DNI. Revisá el dato e intentá nuevamente.")
      }
      const ticket = await ticketDeReserva(reserva.token)
      exigir(ticket, "Encontramos la reserva, pero no pudimos abrir el ticket. Probá nuevamente.")
      return { ok: true, token: reserva.token, ticket: ticket! }
    },
    mensajesDelSitio,
  )
}
