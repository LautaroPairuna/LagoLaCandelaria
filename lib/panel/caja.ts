import { Prisma } from "@/generated/prisma/client"
import type { FormaPago } from "@/generated/prisma/enums"
import { totalDeCuenta } from "@/lib/panel/local"
import {
  cajonDe,
  cajones,
  deudaDe,
  ingresosPorSeccion,
  nombreDelCajon,
  nombreDeSeccion,
  renglonesDeMovimiento,
  seccionDelLocal,
  secciones,
  totalesPorCajon,
  type Cajon,
  type Renglon,
  type Seccion,
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

const nombreDeForma = { EFECTIVO: "efectivo", DEBITO: "débito", TRANSFERENCIA: "transferencia" } as const

export function esSeccion(valor: string | undefined): valor is Seccion {
  return (secciones as string[]).includes(valor ?? "")
}

const localDe = { restaurante: "RESTAURANTE", bar: "BAR" } as const

function localesDe(incluidas: Seccion[]) {
  return incluidas.filter((seccion) => seccion === "restaurante" || seccion === "bar").map((seccion) => localDe[seccion as "restaurante" | "bar"])
}

/// Los renglones del período de las secciones pedidas, del más nuevo al más viejo.
async function renglonesEntre(desde: string, hasta: string, incluidas: Seccion[]): Promise<Renglon[]> {
  const entre = { gte: aFechaDb(desde), lte: aFechaDb(hasta) }
  const locales = localesDe(incluidas)
  const [pagos, cuentas, movimientos] = await Promise.all([
    incluidas.includes("reservas")
      ? db().pago.findMany({
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
        })
      : [],
    locales.length
      ? db().cuentaDeMesa.findMany({
          where: { fecha: entre, estado: "COBRADA", local: { in: locales } },
          select: { id: true, local: true, fecha: true, mesa: true, titular: true, forma: true, cobradaEn: true, cobradaPor: true, items: { select: { precio: true, cantidad: true } } },
        })
      : [],
    incluidas.includes("predio") ? db().movimientoCaja.findMany({ where: { fecha: entre } }) : [],
  ])

  const cobros: Renglon[] = pagos.map((pago) => ({
    origen: "cobro",
    seccion: "reservas",
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
  const deLocales: Renglon[] = cuentas.flatMap((cuenta) => {
    const forma = cuenta.forma ?? "EFECTIVO"
    const monto = totalDeCuenta(cuenta.items)
    if (!monto) return []
    return [
      {
        origen: "cuenta" as const,
        seccion: seccionDelLocal(cuenta.local),
        clave: `k${cuenta.id}`,
        fecha: deFechaDb(cuenta.fecha),
        hora: cuenta.cobradaEn ?? new Date(),
        cajon: cajonDe(forma),
        sentido: "ingreso" as const,
        monto,
        concepto: `${cuenta.mesa}${cuenta.titular ? ` · ${cuenta.titular}` : ""}`,
        registradoPor: cuenta.cobradaPor,
        local: cuenta.local,
        cuentaId: cuenta.id,
        forma,
      },
    ]
  })
  const manuales = movimientos.flatMap((movimiento) => renglonesDeMovimiento({ ...movimiento, fecha: deFechaDb(movimiento.fecha) }))
  return [...cobros, ...deLocales, ...manuales].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.getTime() - a.hora.getTime())
}

/// Cuánto hay en cada cajón a una fecha, sumando toda la historia de las secciones pedidas.
async function balancesAl(hasta: string, incluidas: Seccion[]): Promise<Record<Cajon, number>> {
  const hastaDb = aFechaDb(hasta)
  const locales = localesDe(incluidas)
  const [cobros, cuentas, movimientos] = await Promise.all([
    incluidas.includes("reservas") ? db().pago.groupBy({ by: ["forma"], where: { fecha: { lte: hastaDb }, ...cobroEnCaja }, _sum: { importe: true } }) : [],
    locales.length
      ? db().$queryRaw<{ forma: FormaPago | null; total: number | bigint | string | null }[]>`
          SELECT c.forma AS forma, SUM(i.precio * i.cantidad) AS total
          FROM cuentas_de_mesa c JOIN cuenta_items i ON i.cuentaId = c.id
          WHERE c.estado = 'COBRADA' AND c.fecha <= ${hastaDb} AND c.local IN (${Prisma.join(locales)})
          GROUP BY c.forma`
      : [],
    incluidas.includes("predio") ? db().movimientoCaja.groupBy({ by: ["tipo", "cajon"], where: { fecha: { lte: hastaDb } }, _sum: { monto: true } }) : [],
  ])
  const balance: Record<Cajon, number> = { EFECTIVO: 0, BANCO: 0 }
  for (const fila of cobros) balance[cajonDe(fila.forma)] += fila._sum.importe ?? 0
  for (const fila of cuentas) balance[cajonDe(fila.forma ?? "EFECTIVO")] += Number(fila.total ?? 0)
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

/// El libro de una caja: la de una sección (reservas, restaurante, bar) o la general,
/// que junta todas y suma los egresos y pases del predio.
export async function libroDeCaja(desde: string, hasta: string, incluidas: Seccion[] = secciones) {
  const [renglones, balances] = await Promise.all([renglonesEntre(desde, hasta, incluidas), balancesAl(hasta, incluidas)])
  const totales = totalesPorCajon(renglones)
  return {
    renglones,
    resumen: cajones.map((cajon) => ({ ...cajon, ...totales[cajon.id], balance: balances[cajon.id] })),
    porSeccion: ingresosPorSeccion(renglones),
  }
}

export type Resumen = Awaited<ReturnType<typeof libroDeCaja>>["resumen"]

/// Las cuentas abiertas de los locales (de cualquier día): lo que falta cobrar.
export async function pendienteDeLocales() {
  const abiertas = await db().cuentaDeMesa.findMany({
    where: { estado: "ABIERTA" },
    orderBy: [{ fecha: "desc" }, { creadoEn: "asc" }],
    select: { id: true, local: true, fecha: true, mesa: true, titular: true, items: { select: { precio: true, cantidad: true } } },
  })
  const lista = abiertas
    .map((cuenta) => ({ id: cuenta.id, local: cuenta.local, fecha: deFechaDb(cuenta.fecha), mesa: cuenta.mesa, titular: cuenta.titular, total: totalDeCuenta(cuenta.items) }))
    .filter((cuenta) => cuenta.total > 0)
  const total = (local: "RESTAURANTE" | "BAR") => lista.filter((cuenta) => cuenta.local === local).reduce((suma, cuenta) => suma + cuenta.total, 0)
  return { lista, restaurante: total("RESTAURANTE"), bar: total("BAR") }
}

export type CuentaPendiente = Awaited<ReturnType<typeof pendienteDeLocales>>["lista"][number]

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

/// Cobros de reservas que todavía no llegaron (señas, pagos por adelantado). No entran a
/// la caja hasta que el grupo llega, pero se muestran aparte para que ninguno se pierda.
export async function cobrosAnticipados() {
  const pagos = await db().pago.findMany({
    where: { reserva: { estado: { not: "CANCELADA" }, ingresoEn: null } },
    orderBy: [{ fecha: "desc" }, { creadoEn: "desc" }],
    select: {
      id: true,
      fecha: true,
      forma: true,
      importe: true,
      registradoPor: true,
      reserva: { select: { id: true, codigo: true, desde: true, institucion: true, cliente: { select: { nombre: true, apellido: true } } } },
    },
  })
  return pagos.map((pago) => ({
    id: pago.id,
    fecha: deFechaDb(pago.fecha),
    cajon: cajonDe(pago.forma),
    forma: pago.forma,
    importe: pago.importe,
    registradoPor: pago.registradoPor,
    reservaId: pago.reserva.id,
    codigo: pago.reserva.codigo,
    llega: deFechaDb(pago.reserva.desde),
    titular: titularDe(pago.reserva),
  }))
}

export type Anticipado = Awaited<ReturnType<typeof cobrosAnticipados>>[number]

/// Cómo se nombra cada renglón en la lista y en el Excel.
export function tipoDeRenglon(renglon: Renglon) {
  if (renglon.origen === "cobro") return `Cobro de reserva · ${nombreDeForma[renglon.forma]}`
  if (renglon.origen === "cuenta") return `Cuenta de ${nombreDeSeccion[renglon.seccion].toLowerCase()} · ${nombreDeForma[renglon.forma]}`
  if (renglon.tipo === "TRANSFERENCIA") return renglon.sentido === "ingreso" ? "Pase entre cajones · entra" : "Pase entre cajones · sale"
  return renglon.sentido === "ingreso" ? "Ingreso" : "Egreso"
}

function celda(valor: string | number) {
  const texto = String(valor)
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

const fechaCorta = (iso: string) => iso.split("-").reverse().join("/")

/// La lista visible con el resumen de cada cajón al final, en CSV con punto y coma,
/// que es lo que Excel en español abre sin asistente.
export function cajaEnCsv(renglones: Renglon[], resumen: Resumen, hasta: string, hora: (fecha: Date) => string) {
  const filas: (string | number)[][] = [
    ["Fecha", "Hora", "Sección", "Cajón", "Tipo", "Concepto", "Reserva", "Ingreso", "Egreso", "Cargó"],
    ...renglones.map((renglon) => [
      fechaCorta(renglon.fecha),
      hora(renglon.hora),
      nombreDeSeccion[renglon.seccion],
      nombreDelCajon[renglon.cajon],
      tipoDeRenglon(renglon),
      renglon.concepto,
      renglon.origen === "cobro" ? `${renglon.reservaId} (${renglon.codigo})` : "",
      renglon.sentido === "ingreso" ? renglon.monto : "",
      renglon.sentido === "egreso" ? renglon.monto : "",
      renglon.registradoPor ?? "",
    ]),
    [],
    ["Resumen", "", "", "Cajón", "", "", "", "Ingreso", "Egreso", `Balance al ${fechaCorta(hasta)}`],
    ...resumen.map((cajon) => ["", "", "", cajon.nombre, "", "", "", cajon.ingreso, cajon.egreso, cajon.balance]),
  ]
  return `﻿${filas.map((fila) => fila.map(celda).join(";")).join("\r\n")}\r\n`
}
