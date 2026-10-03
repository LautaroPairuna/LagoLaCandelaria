"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { permisoParaAccion } from "@/lib/panel/sesion"
import { db } from "@/lib/prisma"

const idDeReserva = z.number().int().positive()

export async function confirmarReserva(id: number) {
  await permisoParaAccion("reservas")
  const reservaId = idDeReserva.parse(id)
  await db().reserva.updateMany({ where: { id: reservaId, estado: "PENDIENTE" }, data: { estado: "CONFIRMADA" } })
  revalidatePath("/panel/reservas", "layout")
}

// Cancelar libera los lugares: se borran sus ocupaciones en la misma transacción.
export async function cancelarReserva(id: number) {
  await permisoParaAccion("reservas")
  const reservaId = idDeReserva.parse(id)
  await db().$transaction([
    db().ocupacion.deleteMany({ where: { reservaId } }),
    db().reserva.updateMany({ where: { id: reservaId, estado: { not: "CANCELADA" } }, data: { estado: "CANCELADA" } }),
  ])
  revalidatePath("/panel/reservas", "layout")
}
