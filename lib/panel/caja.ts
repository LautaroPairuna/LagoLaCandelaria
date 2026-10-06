import type { FormaPago } from "@/generated/prisma/enums"
import type { FormaDeCobro } from "@/lib/panel/cobros"
import { aFechaDb, deFechaDb } from "@/lib/predio/fechas"
import { db } from "@/lib/prisma"

export const formas: { id: FormaDeCobro; nombre: string }[] = [
  { id: "EFECTIVO", nombre: "Efectivo" },
  { id: "TRANSFERENCIA", nombre: "Transferencia" },
  { id: "DEBITO", nombre: "Débito" },
]

export type Cobro = {
  id: number
  fecha: string
  hora: Date
  forma: FormaPago
  importe: number
  descuento: number
  reservaId: number
  titular: string
  detalle: string | null
  registradoPor: string | null
}

export async function cobrosEntre(desde: string, hasta: string): Promise<Cobro[]> {
  const pagos = await db().pago.findMany({
    where: { fecha: { gte: aFechaDb(desde), lte: aFechaDb(hasta) } },
    orderBy: [{ fecha: "asc" }, { creadoEn: "asc" }],
    select: {
      id: true,
      fecha: true,
      creadoEn: true,
      forma: true,
      importe: true,
      descuento: true,
      detalle: true,
      registradoPor: true,
      reserva: { select: { id: true, institucion: true, cliente: { select: { nombre: true, apellido: true } } } },
    },
  })
  return pagos.map((pago) => ({
    id: pago.id,
    fecha: deFechaDb(pago.fecha),
    hora: pago.creadoEn,
    forma: pago.forma,
    importe: pago.importe,
    descuento: pago.descuento,
    reservaId: pago.reserva.id,
    titular: pago.reserva.institucion ?? `${pago.reserva.cliente.nombre} ${pago.reserva.cliente.apellido}`,
    detalle: pago.detalle,
    registradoPor: pago.registradoPor,
  }))
}

/// Separa los cobros por forma de pago con su total, en el orden en que se muestran.
export function porForma(cobros: Cobro[]) {
  return formas.map((forma) => {
    const lista = cobros.filter((cobro) => cobro.forma === forma.id)
    return {
      ...forma,
      cobros: lista,
      total: lista.reduce((suma, cobro) => suma + cobro.importe, 0),
      descuentos: lista.reduce((suma, cobro) => suma + cobro.descuento, 0),
    }
  })
}

function celda(valor: string | number) {
  const texto = String(valor)
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

/// CSV con punto y coma, que es lo que Excel en español abre sin asistente.
export function cobrosEnCsv(cobros: Cobro[], hora: (fecha: Date) => string) {
  const filas = [
    ["Fecha", "Hora", "Forma", "Importe", "Descuento", "Reserva", "Titular", "Detalle", "Cargó"],
    ...cobros.map((cobro) => [
      cobro.fecha.split("-").reverse().join("/"),
      hora(cobro.hora),
      formas.find((forma) => forma.id === cobro.forma)?.nombre ?? cobro.forma,
      cobro.importe,
      cobro.descuento,
      cobro.reservaId,
      cobro.titular,
      cobro.detalle ?? "",
      cobro.registradoPor ?? "",
    ]),
  ]
  return `﻿${filas.map((fila) => fila.map(celda).join(";")).join("\r\n")}\r\n`
}
