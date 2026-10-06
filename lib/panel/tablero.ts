import { resumenDeAsistencia } from "@/lib/panel/asistencia"
import { totalesPorForma } from "@/lib/panel/cobros"
import { aFechaDb, deFechaDb, fechasEntre, sumarDiasIso } from "@/lib/predio/fechas"
import { unidadesDelTipo } from "@/lib/predio/inventario"
import { lineas, type LineaId } from "@/lib/predio/nombres"
import { db } from "@/lib/prisma"

export const rangosDeEdad = [
  { etiqueta: "18 a 25", hasta: 25 },
  { etiqueta: "26 a 35", hasta: 35 },
  { etiqueta: "36 a 45", hasta: 45 },
  { etiqueta: "46 a 55", hasta: 55 },
  { etiqueta: "56 a 65", hasta: 65 },
  { etiqueta: "66 o más", hasta: Number.POSITIVE_INFINITY },
] as const

export type Periodo = { desde: string; hasta: string }

export function periodoAnterior({ desde, hasta }: Periodo): Periodo {
  const dias = fechasEntre(desde, hasta).length
  return { desde: sumarDiasIso(desde, -dias), hasta: sumarDiasIso(desde, -1) }
}

export function variacion(actual: number, anterior: number) {
  if (anterior === 0) return actual === 0 ? 0 : null
  return Math.round(((actual - anterior) / anterior) * 100)
}

async function reservasDelPeriodo({ desde, hasta }: Periodo) {
  return db().reserva.findMany({
    where: { estado: { not: "CANCELADA" }, desde: { gte: aFechaDb(desde), lte: aFechaDb(hasta) } },
    select: {
      desde: true,
      modulo: true,
      adultos: true,
      menores: true,
      sinCargo: true,
      clienteId: true,
      personas: { where: { responsable: true }, select: { edad: true } },
    },
  })
}

async function cobradoEn({ desde, hasta }: Periodo) {
  const pagos = await db().pago.aggregate({
    where: { fecha: { gte: aFechaDb(desde), lte: aFechaDb(hasta) } },
    _sum: { importe: true },
  })
  return pagos._sum.importe ?? 0
}

// Un cliente es nuevo en el período si su primera reserva (no cancelada) cae adentro.
async function primerasReservas(clientes: number[]) {
  if (clientes.length === 0) return new Map<number, string>()
  const filas = await db().reserva.groupBy({
    by: ["clienteId"],
    where: { clienteId: { in: clientes }, estado: { not: "CANCELADA" } },
    _min: { desde: true },
  })
  return new Map(filas.map((fila) => [fila.clienteId, fila._min.desde ? deFechaDb(fila._min.desde) : ""]))
}

function resumirPeriodo(reservas: Awaited<ReturnType<typeof reservasDelPeriodo>>, primeras: Map<number, string>, periodo: Periodo) {
  const personas = reservas.reduce((suma, reserva) => suma + reserva.adultos + reserva.menores + reserva.sinCargo, 0)
  const clientes = new Set(reservas.map((reserva) => reserva.clienteId))
  const nuevos = [...clientes].filter((id) => (primeras.get(id) ?? "") >= periodo.desde).length
  return { reservas: reservas.length, personas, clientes: clientes.size, nuevos }
}

export async function reportes(periodo: Periodo) {
  const anterior = periodoAnterior(periodo)
  const [actuales, previas, cobrado, cobradoAntes] = await Promise.all([
    reservasDelPeriodo(periodo),
    reservasDelPeriodo(anterior),
    cobradoEn(periodo),
    cobradoEn(anterior),
  ])
  const primeras = await primerasReservas([...new Set([...actuales, ...previas].map((reserva) => reserva.clienteId))])
  const ahora = resumirPeriodo(actuales, primeras, periodo)
  const antes = resumirPeriodo(previas, primeras, anterior)

  const meses = new Map<string, { adultos: number; menores: number; sinCargo: number }>()
  for (let mes = periodo.desde.slice(0, 7); mes <= periodo.hasta.slice(0, 7); ) {
    meses.set(mes, { adultos: 0, menores: 0, sinCargo: 0 })
    const [anio, numero] = mes.split("-").map(Number)
    mes = new Date(Date.UTC(anio, numero, 1)).toISOString().slice(0, 7)
  }
  for (const reserva of actuales) {
    const fila = meses.get(deFechaDb(reserva.desde).slice(0, 7))
    if (!fila) continue
    fila.adultos += reserva.adultos
    fila.menores += reserva.menores
    fila.sinCargo += reserva.sinCargo
  }

  const porLinea = new Map<LineaId, { reservas: number; personas: number }>(lineas.map((linea) => [linea.id, { reservas: 0, personas: 0 }]))
  for (const reserva of actuales) {
    const linea = lineas.find((item) => (item.modulos as readonly string[]).includes(reserva.modulo))
    if (!linea) continue
    const fila = porLinea.get(linea.id)!
    fila.reservas += 1
    fila.personas += reserva.adultos + reserva.menores + reserva.sinCargo
  }

  const edades = rangosDeEdad.map((rango) => ({ etiqueta: rango.etiqueta, cantidad: 0 }))
  for (const reserva of actuales) {
    for (const { edad } of reserva.personas) {
      if (edad < 18) continue
      const indice = rangosDeEdad.findIndex((rango) => edad <= rango.hasta)
      edades[indice].cantidad += 1
    }
  }

  return {
    anterior,
    indicadores: {
      reservas: { valor: ahora.reservas, variacion: variacion(ahora.reservas, antes.reservas) },
      personas: { valor: ahora.personas, variacion: variacion(ahora.personas, antes.personas) },
      cobrado: { valor: cobrado, variacion: variacion(cobrado, cobradoAntes) },
      nuevos: {
        valor: ahora.clientes ? Math.round((ahora.nuevos / ahora.clientes) * 100) : 0,
        cantidad: ahora.nuevos,
        clientes: ahora.clientes,
      },
    },
    porMes: [...meses].map(([mes, valores]) => ({ mes, ...valores })),
    porLinea: lineas.map((linea) => ({ id: linea.id, nombre: linea.nombre, ...porLinea.get(linea.id)! })),
    edades,
  }
}

export async function resumenDelDia(hoy: string) {
  const [llegadas, pagos, pendientes, ocupaciones] = await Promise.all([
    db().reserva.findMany({
      where: { estado: { not: "CANCELADA" }, desde: { lte: aFechaDb(hoy) }, hasta: { gte: aFechaDb(hoy) } },
      select: {
        adultos: true,
        menores: true,
        sinCargo: true,
        hasta: true,
        ingresoEn: true,
        salidaEn: true,
        personas: { select: { ingresoEn: true, salidaEn: true } },
      },
    }),
    db().pago.findMany({ where: { fecha: aFechaDb(hoy) }, select: { forma: true, importe: true } }),
    db().reserva.count({ where: { estado: "PENDIENTE", hasta: { gte: aFechaDb(hoy) } } }),
    db().ocupacion.findMany({ where: { fecha: aFechaDb(hoy) }, select: { unidadId: true } }),
  ])

  const tomadas = new Set(ocupaciones.map((fila) => fila.unidadId))
  const ocupacion = (
    [
      ["Parrillas y quinchos", ["PARRILLA", "QUINCHO"]],
      ["Gazebos y palapas", ["GAZEBO", "PALAPA"]],
      ["Bungalows", ["BUNGALOW"]],
    ] as const
  ).map(([nombre, tipos]) => {
    const unidades = unidadesDelTipo(...tipos)
    return { nombre, ocupadas: unidades.filter((unidad) => tomadas.has(unidad.id)).length, total: unidades.length }
  })

  const personas = (fila: { adultos: number; menores: number; sinCargo: number }) => fila.adultos + fila.menores + fila.sinCargo
  return {
    grupos: llegadas.length,
    esperadas: llegadas.reduce((suma, fila) => suma + personas(fila), 0),
    adentro: llegadas.reduce((suma, fila) => suma + resumenDeAsistencia({ ...fila, hasta: deFechaDb(fila.hasta) }, hoy).adentro, 0),
    caja: totalesPorForma(pagos),
    pendientes,
    ocupacion,
  }
}
