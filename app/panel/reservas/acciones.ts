"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { accion, exigir, type Resultado } from "@/lib/errores"
import { permisoParaAccion } from "@/lib/panel/sesion"
import { db } from "@/lib/prisma"

const idDeReserva = z.number().int().positive()

export async function confirmarReserva(id: number): Promise<Resultado> {
  return accion("confirmarReserva", async () => {
    await permisoParaAccion("reservas")
    const reservaId = idDeReserva.parse(id)
    const { count } = await db().reserva.updateMany({ where: { id: reservaId, estado: "PENDIENTE" }, data: { estado: "CONFIRMADA" } })
    revalidatePath("/panel/reservas", "layout")
    exigir(count > 0, "Esta reserva ya no estaba pendiente: alguien la confirmó o la canceló recién. Ya te mostramos cómo quedó.")
    return { ok: true }
  })
}

// Cancelar libera los lugares: se borran sus ocupaciones en la misma transacción.
export async function cancelarReserva(id: number): Promise<Resultado> {
  return accion("cancelarReserva", async () => {
    await permisoParaAccion("reservas")
    const reservaId = idDeReserva.parse(id)
    const [, { count }] = await db().$transaction([
      db().ocupacion.deleteMany({ where: { reservaId } }),
      db().reserva.updateMany({ where: { id: reservaId, estado: { not: "CANCELADA" } }, data: { estado: "CANCELADA" } }),
    ])
    revalidatePath("/panel/reservas", "layout")
    exigir(count > 0, "Esta reserva ya estaba cancelada. Ya te mostramos cómo quedó.")
    return { ok: true }
  })
}
