"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { cobroDelSaldo, saldoDe } from "@/lib/panel/cobros"
import { permisoParaAccion } from "@/lib/panel/sesion"
import { aFechaDb } from "@/lib/predio/fechas"
import { db } from "@/lib/prisma"
import { hoyIso, type SolicitudGuardada } from "@/lib/solicitud"

const idDeReserva = z.number().int().positive()

function refrescar() {
  revalidatePath("/panel/puerta")
  revalidatePath("/panel/reservas", "layout")
}

export async function marcarIngreso(id: number) {
  const sesion = await permisoParaAccion("puerta")
  await db().reserva.updateMany({
    where: { id: idDeReserva.parse(id), estado: { not: "CANCELADA" }, ingresoEn: null },
    data: { ingresoEn: new Date(), ingresoPor: sesion.user.name.slice(0, 80) },
  })
  refrescar()
}

export async function deshacerIngreso(id: number) {
  await permisoParaAccion("puerta")
  await db().reserva.updateMany({ where: { id: idDeReserva.parse(id) }, data: { ingresoEn: null, ingresoPor: null } })
  refrescar()
}

const pedidoDeCobro = z.object({
  id: idDeReserva,
  forma: z.enum(["EFECTIVO", "DEBITO", "TRANSFERENCIA"]),
  importe: z.number().int().positive().max(50_000_000).optional(),
})

export type ResultadoCobro = { ok: true; importe: number } | { ok: false; error: string }

export async function cobrar(pedido: z.input<typeof pedidoDeCobro>): Promise<ResultadoCobro> {
  const sesion = await permisoParaAccion("puerta")
  const entrada = pedidoDeCobro.safeParse(pedido)
  if (!entrada.success) return { ok: false, error: "Revisá el importe." }
  const { id, forma, importe } = entrada.data

  const resultado = await db().$transaction(async (tx) => {
    const reserva = await tx.reserva.findUnique({
      where: { id },
      select: { estado: true, total: true, detalle: true, pagos: { select: { importe: true, descuento: true } } },
    })
    if (!reserva || reserva.estado === "CANCELADA") return { ok: false as const, error: "La reserva no está activa." }

    const aConfirmar = Boolean((reserva.detalle as unknown as SolicitudGuardada).cotizacion?.aConfirmar)
    let cobro: { importe: number; descuento: number }
    if (importe) {
      cobro = { importe, descuento: 0 }
    } else {
      const saldo = saldoDe(reserva.total, reserva.pagos)
      if (aConfirmar || saldo === 0) return { ok: false as const, error: "No hay saldo para cobrar. Cargá el importe a mano." }
      cobro = cobroDelSaldo(saldo, forma)
    }

    await tx.pago.create({
      data: {
        reservaId: id,
        fecha: aFechaDb(hoyIso()),
        forma,
        ...cobro,
        detalle: importe ? "Cobro en puerta" : "Saldo en puerta",
        registradoPor: sesion.user.name.slice(0, 80),
      },
    })
    return { ok: true as const, importe: cobro.importe }
  })

  if (resultado.ok) refrescar()
  return resultado
}
