"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { accion, exigir, ErrorHumano, type Resultado } from "@/lib/errores"
import { cobroDelSaldo, saldoDe } from "@/lib/panel/cobros"
import { permisoParaAccion } from "@/lib/panel/sesion"
import { aplicar, porPersona } from "@/lib/panel/asistencia"
import { aFechaDb, deFechaDb, hoyEnElPredio } from "@/lib/predio/fechas"
import { db } from "@/lib/prisma"
import { detalleDe } from "@/lib/reservas"

const idDeReserva = z.number().int().positive()

function refrescar() {
  revalidatePath("/panel/puerta")
  revalidatePath("/panel", "layout")
}

const pedidoDeAsistencia = z.object({
  reservaId: idDeReserva,
  movimiento: z.enum(["ingreso", "salida", "deshacer"]),
  // Sin personas, el movimiento es para todas las que corresponda (o la reserva entera).
  personas: z.array(z.number().int().positive()).max(200).optional(),
})

/// Registra ingresos, salidas o deshace el último paso, de algunas personas o de toda
/// la reserva. Devuelve a cuántas personas afectó.
export async function registrarAsistencia(pedido: z.input<typeof pedidoDeAsistencia>): Promise<Resultado<{ personas: number }>> {
  return accion("registrarAsistencia", async () => {
    const sesion = await permisoParaAccion("puerta")
    const { reservaId, movimiento, personas: elegidas } = pedidoDeAsistencia.parse(pedido)
    const ahora = new Date()
    const quien = sesion.user.name.slice(0, 80)

    const afectadas = await db().$transaction(async (tx) => {
      const reserva = await tx.reserva.findUnique({
        where: { id: reservaId },
        select: {
          estado: true,
          desde: true,
          adultos: true,
          menores: true,
          sinCargo: true,
          ingresoEn: true,
          salidaEn: true,
          personas: { select: { id: true, ingresoEn: true, salidaEn: true } },
        },
      })
      if (!reserva || reserva.estado === "CANCELADA") throw new ErrorHumano("Esta reserva se canceló, así que no se puede registrar el ingreso. Revisala en Reservas.")
      if (deFechaDb(reserva.desde) > hoyEnElPredio()) throw new ErrorHumano("Esta reserva es para más adelante: el ingreso se marca el día que llegan.")

      if (!porPersona(reserva)) {
        const cambio = aplicar(movimiento, reserva, ahora)
        if (!cambio) return 0
        await tx.reserva.update({
          where: { id: reservaId },
          data: { ...cambio, ingresoPor: cambio.ingresoEn ? (reserva.ingresoEn ? undefined : quien) : null },
        })
        return reserva.adultos + reserva.menores + reserva.sinCargo
      }

      const objetivo = elegidas ? reserva.personas.filter((persona) => elegidas.includes(persona.id)) : reserva.personas
      const cambios = objetivo.flatMap((persona) => {
        const cambio = aplicar(movimiento, persona, ahora)
        return cambio ? [{ id: persona.id, ...cambio }] : []
      })
      for (const { id, ...cambio } of cambios) await tx.reservaPersona.update({ where: { id }, data: cambio })

      // La reserva guarda el primer ingreso y, cuando ya no queda nadie adentro, la salida.
      const despues = reserva.personas.map((persona) => cambios.find((cambio) => cambio.id === persona.id) ?? persona)
      const ingresos = despues.flatMap((persona) => (persona.ingresoEn ? [persona.ingresoEn.getTime()] : []))
      const quedanAdentro = despues.some((persona) => persona.ingresoEn && !persona.salidaEn)
      await tx.reserva.update({
        where: { id: reservaId },
        data: {
          ingresoEn: ingresos.length ? new Date(Math.min(...ingresos)) : null,
          ingresoPor: ingresos.length ? (reserva.ingresoEn ? undefined : quien) : null,
          salidaEn: ingresos.length && !quedanAdentro ? ahora : null,
        },
      })
      return cambios.length
    })

    refrescar()
    exigir(
      afectadas > 0,
      movimiento === "ingreso"
        ? "Ya figuraban adentro. Te mostramos cómo quedó."
        : movimiento === "salida"
          ? "No hay nadie adentro para marcar la salida."
          : "No había nada para deshacer.",
    )
    return { ok: true, personas: afectadas }
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
