"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { accion, ErrorHumano, exigir, type Resultado } from "@/lib/errores"
import { registrarActividad } from "@/lib/panel/actividad"
import { nombreDelCajon } from "@/lib/panel/libro-caja"
import { permisoParaAccion } from "@/lib/panel/sesion"
import { aFechaDb, deFechaDb, esFechaIso, hoyEnElPredio, sumarDiasIso } from "@/lib/predio/fechas"
import { pesos } from "@/lib/predio/tarifas"
import { db } from "@/lib/prisma"

const nuevoMovimiento = z.object({
  tipo: z.enum(["INGRESO", "EGRESO", "TRANSFERENCIA"], "Elegí si es un ingreso, un egreso o un pase entre cajones."),
  cajon: z.enum(["EFECTIVO", "BANCO"], "Elegí el cajón."),
  fecha: z.string(),
  concepto: z.string().trim().min(3, "Contá de qué es: «Combustible», «Retiro», «Depósito en el banco».").max(160, "Es muy largo: dejalo en 160 letras o menos."),
  monto: z.number("Escribí el monto en pesos, sin puntos.").int("Escribí el monto en pesos, sin centavos.").positive("El monto tiene que ser mayor a cero.").max(500_000_000, "Ese monto es demasiado grande. Revisalo."),
})

const otroCajon = { EFECTIVO: "BANCO", BANCO: "EFECTIVO" } as const

function describir(movimiento: { tipo: "INGRESO" | "EGRESO" | "TRANSFERENCIA"; cajon: "EFECTIVO" | "BANCO"; monto: number; concepto: string }) {
  const monto = pesos(movimiento.monto)
  if (movimiento.tipo === "TRANSFERENCIA") return `pase de ${monto} de ${nombreDelCajon[movimiento.cajon]} a ${nombreDelCajon[otroCajon[movimiento.cajon]]}: ${movimiento.concepto}`
  return `${movimiento.tipo === "INGRESO" ? "ingreso" : "egreso"} de ${monto} en ${nombreDelCajon[movimiento.cajon]}: ${movimiento.concepto}`
}

export async function cargarMovimiento(pedido: z.input<typeof nuevoMovimiento>): Promise<Resultado<{ id: number }>> {
  return accion("cargarMovimiento", async () => {
    const sesion = await permisoParaAccion("caja")
    const datos = nuevoMovimiento.parse(pedido)
    const hoy = hoyEnElPredio()
    exigir(esFechaIso(datos.fecha) && datos.fecha <= hoy && datos.fecha >= sumarDiasIso(hoy, -400), "Elegí una fecha de hoy o anterior, dentro del último año.")
    const quien = sesion.user.name.slice(0, 80)
    const id = await db().$transaction(async (tx) => {
      const creado = await tx.movimientoCaja.create({ data: { ...datos, fecha: aFechaDb(datos.fecha), registradoPor: quien }, select: { id: true } })
      await registrarActividad(tx, { usuario: quien, accion: "movimiento", detalle: `Cargó un ${describir(datos)}`, monto: datos.monto })
      return creado.id
    })
    revalidatePath("/panel/caja", "layout")
    return { ok: true, id }
  })
}

export async function borrarMovimiento(pedido: { id: number }): Promise<Resultado<{ id: number }>> {
  return accion("borrarMovimiento", async () => {
    const sesion = await permisoParaAccion("caja")
    const id = z.number().int().positive().parse(pedido.id)
    const quien = sesion.user.name.slice(0, 80)
    await db().$transaction(async (tx) => {
      const movimiento = await tx.movimientoCaja.findUnique({ where: { id } })
      if (!movimiento) throw new ErrorHumano("Ese movimiento ya no estaba: alguien lo borró antes. Te mostramos cómo quedó.")
      await tx.movimientoCaja.delete({ where: { id } })
      await registrarActividad(tx, {
        usuario: quien,
        accion: "movimiento borrado",
        detalle: `Borró un ${describir(movimiento)} (del ${deFechaDb(movimiento.fecha).split("-").reverse().join("/")})`,
        monto: movimiento.monto,
      })
    })
    revalidatePath("/panel/caja", "layout")
    return { ok: true, id }
  })
}
