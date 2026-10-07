import type { Prisma } from "@/generated/prisma/client"
import {
  cajonDe,
  cajones,
  deudaDe,
  nombreDelCajon,
  renglonesDeMovimiento,
  totalesPorCajon,
  type Cajon,
  type Renglon,
} from "@/lib/panel/libro-caja"
import { aFechaDb, deFechaDb } from "@/lib/predio/fechas"
import { db } from "@/lib/prisma"
import { detalleDe } from "@/lib/reservas"

export type FiltroDeCajon = "todos" | Cajon

export function esFiltroDeCajon(valor: string | undefined): valor is FiltroDeCajon {
  return valor === "todos" || valor === "EFECTIVO" || valor === "BANCO"
}

// Un cobro entra a la caja recién cuando el grupo llegó al predio (tiene un ingreso
// marcado). Mientras la reserva está pendiente o confirmada sin llegar, no figura; si se
// cancela, nunca.
const cobroEnCaja = { reserva: { estado: { not: "CANCELADA" }, ingresoEn: { not: null } } } satisfies Prisma.PagoWhereInput

const titularDe = (reserva: { institucion: string | null; cliente: { nombre: string; apellido: string } }) =>
  reserva.institucion ?? `${reserva.cliente.nombre} ${reserva.cliente.apellido}`

/// Los renglones del período (cobros y movimientos), del más nuevo al más viejo.
async function renglonesEntre(desde: string, hasta: string): Promise<Renglon[]> {
  const entre = { gte: aFechaDb(desde), lte: aFechaDb(hasta) }
  const [pagos, movimientos] = await Promise.all([
    db().pago.findMany({
      where: { fecha: entre, ...cobroEnCaja },
      select: {
        id: true,
        fecha: true,
        creadoEn: true,
        forma: true,
        importe: true,
        descuento: true,
        registradoPor: true,
        reserva: { select: { id: true, codigo: true, institucion: true, cliente: { select: { nombre: true, apellido: true } } } },
      },
    }),
    db().movimientoCaja.findMany({ where: { fecha: entre } }),
  ])

  const cobros: Renglon[] = pagos.map((pago) => ({
    origen: "cobro",
    clave: `c${pago.id}`,
    fecha: deFechaDb(pago.fecha),
    hora: pago.creadoEn,
    cajon: cajonDe(pago.forma),
    sentido: "ingreso",
    monto: pago.importe,
    concepto: titularDe(pago.reserva),
    registradoPor: pago.registradoPor,
    reservaId: pago.reserva.id,
    codigo: pago.reserva.codigo,
    forma: pago.forma,
    descuento: pago.descuento,
  }))
  const manuales = movimientos.flatMap((movimiento) => renglonesDeMovimiento({ ...movimiento, fecha: deFechaDb(movimiento.fecha) }))
  return [...cobros, ...manuales].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.getTime() - a.hora.getTime())
}

/// Cuánto hay en cada cajón a una fecha, sumando toda la historia.
async function balancesAl(hasta: string): Promise<Record<Cajon, number>> {
  const hastaDb = { lte: aFechaDb(hasta) }
  const [cobros, movimientos] = await Promise.all([
    db().pago.groupBy({ by: ["forma"], where: { fecha: hastaDb, ...cobroEnCaja }, _sum: { importe: true } }),
    db().movimientoCaja.groupBy({ by: ["tipo", "cajon"], where: { fecha: hastaDb }, _sum: { monto: true } }),
  ])
  const balance: Record<Cajon, number> = { EFECTIVO: 0, BANCO: 0 }
  for (const fila of cobros) balance[cajonDe(fila.forma)] += fila._sum.importe ?? 0
  for (const fila of movimientos) {
    const monto = fila._sum.monto ?? 0
    if (fila.tipo === "INGRESO") balance[fila.cajon] += monto
    else if (fila.tipo === "EGRESO") balance[fila.cajon] -= monto
    else {
      balance[fila.cajon] -= monto
      balance[fila.cajon === "EFECTIVO" ? "BANCO" : "EFECTIVO"] += monto
    }
  }
  return balance
}

export async function libroDeCaja(desde: string, hasta: string) {
  const [renglones, balances] = await Promise.all([renglonesEntre(desde, hasta), balancesAl(hasta)])
  const totales = totalesPorCajon(renglones)
  return {
    renglones,
    resumen: cajones.map((cajon) => ({ ...cajon, ...totales[cajon.id], balance: balances[cajon.id] })),
  }
}

export type Resumen = Awaited<ReturnType<typeof libroDeCaja>>["resumen"]

/// Las reservas confirmadas que todavía deben plata, sin importar el período. Primero
/// las que ya vinieron al predio: son las más urgentes de cobrar.
export async function pendientesDeCobro() {
  const filas = await db().reserva.findMany({
    where: { estado: "CONFIRMADA", total: { gt: 0 } },
    orderBy: [{ desde: "asc" }, { id: "asc" }],
    select: {
      id: true,
      codigo: true,
      desde: true,
      hasta: true,
      total: true,
      detalle: true,
      ingresoEn: true,
      institucion: true,
      cliente: { select: { nombre: true, apellido: true, telefono: true } },
      pagos: { select: { importe: true, descuento: true, forma: true } },
    },
  })
  const pendientes = filas.flatMap((fila) => {
    const cotizacion = detalleDe(fila.detalle).cotizacion
    if (cotizacion?.aConfirmar || cotizacion?.consumo) return []
    const deuda = deudaDe(fila.total, fila.pagos)
    if (deuda.saldo === 0) return []
    return [
      {
        id: fila.id,
        codigo: fila.codigo,
        desde: deFechaDb(fila.desde),
        hasta: deFechaDb(fila.hasta),
        titular: titularDe(fila),
        telefono: fila.cliente.telefono,
        vino: fila.ingresoEn !== null,
        total: fila.total,
        cobrado: fila.pagos.reduce((suma, pago) => suma + pago.importe, 0),
        ...deuda,
      },
    ]
  })
  return pendientes.sort((a, b) => Number(b.vino) - Number(a.vino))
}

export type Pendiente = Awaited<ReturnType<typeof pendientesDeCobro>>[number]

function celda(valor: string | number) {
  const texto = String(valor)
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

const fechaCorta = (iso: string) => iso.split("-").reverse().join("/")

/// La lista visible con el resumen de cada cajón al final, en CSV con punto y coma,
/// que es lo que Excel en español abre sin asistente.
export function cajaEnCsv(renglones: Renglon[], resumen: Resumen, hasta: string, hora: (fecha: Date) => string) {
  const filas: (string | number)[][] = [
    ["Fecha", "Hora", "Cajón", "Tipo", "Concepto", "Reserva", "Ingreso", "Egreso", "Cargó"],
    ...renglones.map((renglon) => [
      fechaCorta(renglon.fecha),
      hora(renglon.hora),
      nombreDelCajon[renglon.cajon],
      renglon.origen === "cobro" ? "Cobro de reserva" : renglon.tipo === "TRANSFERENCIA" ? "Pase entre cajones" : renglon.sentido === "ingreso" ? "Ingreso" : "Egreso",
      renglon.concepto,
      renglon.origen === "cobro" ? `${renglon.reservaId} (${renglon.codigo})` : "",
      renglon.sentido === "ingreso" ? renglon.monto : "",
      renglon.sentido === "egreso" ? renglon.monto : "",
      renglon.registradoPor ?? "",
    ]),
    [],
    ["Resumen", "", "Cajón", "", "", "", "Ingreso", "Egreso", `Balance al ${fechaCorta(hasta)}`],
    ...resumen.map((cajon) => ["", "", cajon.nombre, "", "", "", cajon.ingreso, cajon.egreso, cajon.balance]),
  ]
  return `﻿${filas.map((fila) => fila.map(celda).join(";")).join("\r\n")}\r\n`
}
