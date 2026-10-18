"use server"

import { headers } from "next/headers"
import { z } from "zod"

import { accion, exigir, mensajesDelSitio, type Resultado } from "@/lib/errores"
import { limiteAlcanzado, registrarUso } from "@/lib/limite"
import { normalizarTelefono } from "@/lib/predio/contacto"
import { db } from "@/lib/prisma"

const INTENTOS = 8
const VENTANA_MS = 15 * 60 * 1000

const pedido = z.object({
  codigo: z
    .string()
    .trim()
    .toUpperCase()
    .transform((valor) => valor.replace(/\s/g, ""))
    .transform((valor) => (valor.startsWith("LC-") ? valor : `LC-${valor.replace(/^LC/, "")}`))
    .refine((valor) => /^LC-[A-Z0-9]{6}$/.test(valor), "El código tiene 6 letras y números, como LC-AB12CD."),
  telefono: z.string().max(20),
})

/// Busca la reserva con el código y el celular con que se hizo. Los dos datos juntos, y
/// con pocos intentos, para que no se pueda adivinar la reserva de otro.
export async function buscarMiReserva(datos: z.input<typeof pedido>): Promise<Resultado<{ token: string }>> {
  return accion(
    "buscarMiReserva",
    async () => {
      const cabeceras = await headers()
      const ip = cabeceras.get("cf-connecting-ip") ?? cabeceras.get("x-real-ip") ?? cabeceras.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "desconocida"
      const clave = `mi-reserva:${ip}`
      exigir(!limiteAlcanzado(clave, INTENTOS, VENTANA_MS), "Probaste muchas veces. Esperá unos minutos o escribinos por WhatsApp con tu código.")
      const { codigo, telefono } = pedido.parse(datos)
      const normalizado = normalizarTelefono(telefono)
      exigir(normalizado, "Escribí el celular con característica, 10 números (por ejemplo 11 3009 1020).")
      const reserva = await db().reserva.findUnique({ where: { codigo }, select: { token: true, detalle: true, cliente: { select: { telefono: true } } } })
      const propio = (reserva?.detalle as { telefono?: unknown } | null)?.telefono
      const telefonos = [typeof propio === "string" ? propio : null, reserva?.cliente.telefono ?? null]
      const coincide = telefonos.some((guardado) => guardado && normalizarTelefono(guardado)?.nacional === normalizado.nacional)
      if (!coincide) {
        registrarUso(clave, VENTANA_MS)
        exigir(false, "No encontramos una reserva con ese código y ese celular. Revisá los dos datos: están en tu ticket.")
      }
      return { ok: true, token: reserva!.token }
    },
    mensajesDelSitio,
  )
}
