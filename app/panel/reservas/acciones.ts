"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { accion, exigir, type Resultado } from "@/lib/errores"
import { anotar } from "@/lib/panel/actividad"
import { permisoParaAccion } from "@/lib/panel/sesion"
import { db } from "@/lib/prisma"

const idDeReserva = z.number().int().positive()

async function describirReserva(id: number) {
  const reserva = await db().reserva.findUnique({ where: { id }, select: { codigo: true, institucion: true, desde: true, cliente: { select: { nombre: true, apellido: true } } } })
  if (!reserva) return ""
  return `${reserva.institucion ?? `${reserva.cliente.nombre} ${reserva.cliente.apellido}`} (${reserva.codigo}), del ${reserva.desde.toISOString().slice(0, 10).split("-").reverse().join("/")}`
}

export async function confirmarReserva(id: number): Promise<Resultado> {
  return accion("confirmarReserva", async () => {
    const sesion = await permisoParaAccion("reservas")
    const reservaId = idDeReserva.parse(id)
    const { count } = await db().reserva.updateMany({ where: { id: reservaId, estado: "PENDIENTE" }, data: { estado: "CONFIRMADA" } })
    revalidatePath("/panel", "layout")
    exigir(count > 0, "Esta reserva ya no estaba pendiente: alguien la confirmó o la canceló recién. Ya te mostramos cómo quedó.")
    await anotar(sesion, { seccion: "reservas", accion: "confirmó", detalle: `Confirmó la reserva ${reservaId}, ${await describirReserva(reservaId)}`, reservaId })
    return { ok: true }
  })
}

// Cancelar libera los lugares: se borran sus ocupaciones en la misma transacción.
export async function cancelarReserva(id: number): Promise<Resultado> {
  return accion("cancelarReserva", async () => {
    const sesion = await permisoParaAccion("reservas")
    const reservaId = idDeReserva.parse(id)
    const [, { count }] = await db().$transaction([
      db().ocupacion.deleteMany({ where: { reservaId } }),
      db().reserva.updateMany({ where: { id: reservaId, estado: { not: "CANCELADA" } }, data: { estado: "CANCELADA" } }),
    ])
    revalidatePath("/panel", "layout")
    exigir(count > 0, "Esta reserva ya estaba cancelada. Ya te mostramos cómo quedó.")
    await anotar(sesion, { seccion: "reservas", accion: "canceló", detalle: `Canceló la reserva ${reservaId}, ${await describirReserva(reservaId)}`, reservaId })
    return { ok: true }
  })
}
