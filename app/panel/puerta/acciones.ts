"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { accion, exigir, ErrorHumano, type Resultado } from "@/lib/errores"
import { cobroDelSaldo, saldoDe } from "@/lib/panel/cobros"
import { permisoParaAccion } from "@/lib/panel/sesion"
import { aFechaDb, hoyEnElPredio } from "@/lib/predio/fechas"
import { db } from "@/lib/prisma"
import { detalleDe } from "@/lib/reservas"

const idDeReserva = z.number().int().positive()

function refrescar() {
  revalidatePath("/panel/puerta")
  revalidatePath("/panel", "layout")
}

export async function marcarIngreso(id: number): Promise<Resultado> {
  return accion("marcarIngreso", async () => {
    const sesion = await permisoParaAccion("puerta")
    const { count } = await db().reserva.updateMany({
      where: { id: idDeReserva.parse(id), estado: { not: "CANCELADA" }, ingresoEn: null },
      data: { ingresoEn: new Date(), ingresoPor: sesion.user.name.slice(0, 80) },
    })
    refrescar()
    exigir(count > 0, "Este grupo ya figuraba adentro, o la reserva se canceló recién. Ya te mostramos cómo quedó.")
    return { ok: true }
  })
}

export async function deshacerIngreso(id: number): Promise<Resultado> {
  return accion("deshacerIngreso", async () => {
    await permisoParaAccion("puerta")
    await db().reserva.updateMany({ where: { id: idDeReserva.parse(id) }, data: { ingresoEn: null, ingresoPor: null } })
    refrescar()
    return { ok: true }
  })
}

const pedidoDeCobro = z.object({
  id: idDeReserva,
  forma: z.enum(["EFECTIVO", "DEBITO", "TRANSFERENCIA"]),
  importe: z.number().int().positive().max(50_000_000).optional(),
})

export async function cobrar(pedido: z.input<typeof pedidoDeCobro>): Promise<Resultado<{ importe: number }>> {
  return accion("cobrar", async () => {
    const sesion = await permisoParaAccion("puerta")
    const entrada = pedidoDeCobro.safeParse(pedido)
    exigir(entrada.success, "Ese importe no se puede cobrar. Escribilo en pesos, sin puntos ni centavos.")
    const { id, forma, importe } = entrada.data

    const cobrado = await db().$transaction(async (tx) => {
      const reserva = await tx.reserva.findUnique({
        where: { id },
        select: { estado: true, total: true, detalle: true, pagos: { select: { importe: true, descuento: true } } },
      })
      if (!reserva || reserva.estado === "CANCELADA") throw new ErrorHumano("Esta reserva se canceló, así que no se le puede cobrar. Revisala en Reservas.")

      const aConfirmar = Boolean(detalleDe(reserva.detalle).cotizacion?.aConfirmar)
      let cobro: { importe: number; descuento: number }
      if (importe) {
        cobro = { importe, descuento: 0 }
      } else {
        const saldo = saldoDe(reserva.total, reserva.pagos)
        if (aConfirmar) throw new ErrorHumano("El total de esta reserva todavía no está cerrado. Cobrá con «Otro importe» y escribí el monto.")
        if (saldo === 0) throw new ErrorHumano("Esta reserva ya está paga. Si hay que cobrar algo más, usá «Otro importe».")
        cobro = cobroDelSaldo(saldo, forma)
      }

      await tx.pago.create({
        data: {
          reservaId: id,
          fecha: aFechaDb(hoyEnElPredio()),
          forma,
          ...cobro,
          detalle: importe ? "Cobro en puerta" : "Saldo en puerta",
          registradoPor: sesion.user.name.slice(0, 80),
        },
      })
      return cobro.importe
    })

    refrescar()
    return { ok: true, importe: cobrado }
  })
}
