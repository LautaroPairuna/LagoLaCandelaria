import { z } from "zod"

import { db } from "@/lib/prisma"
import { preciosPorDefecto, type Precios } from "@/lib/predio/tarifas"

const CLAVE = "precios"

const importe = z.number().int().min(0).max(100_000_000)
export const esquemaDePrecios = z.object({
  entrada: z.object({ finde: z.object({ adulto: importe, menor: importe }), semana: z.object({ adulto: importe, menor: importe }) }),
  nado: z.object({ finde: importe, semana: importe }),
  bungalow: importe,
})

/// Los precios vigentes: los que guardó la administración o, si no hay, los de fábrica.
/// Se guardan en `ajustes` como un JSON en una sola fila.
export async function leerPrecios(): Promise<Precios> {
  const fila = await db().ajuste.findUnique({ where: { clave: CLAVE } })
  if (!fila) return preciosPorDefecto
  try {
    return esquemaDePrecios.parse(JSON.parse(fila.valor))
  } catch {
    return preciosPorDefecto
  }
}

export async function guardarPrecios(precios: Precios) {
  const valor = JSON.stringify(esquemaDePrecios.parse(precios))
  await db().ajuste.upsert({ where: { clave: CLAVE }, create: { clave: CLAVE, valor }, update: { valor } })
}
