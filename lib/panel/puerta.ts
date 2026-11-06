import type { Prisma } from "@/generated/prisma/client"
import type { Modulo } from "@/generated/prisma/enums"
import { estadoDe, ingresaronPorCantidad, resumenDeAsistencia } from "@/lib/panel/asistencia"
import { saldoDe } from "@/lib/panel/cobros"
import { estadoVisible } from "@/lib/panel/estados"
import { deudaDe } from "@/lib/panel/libro-caja"
import { nombreDeUnidad } from "@/lib/panel/reservas"
import { aFechaDb, deFechaDb, hoyEnElPredio } from "@/lib/predio/fechas"
import { db } from "@/lib/prisma"
import { detalleDe } from "@/lib/reservas"

export async function llegadasDelDia(dia: string, busqueda = "", modulo?: Modulo) {
  return llegadasDonde({ estado: { not: "CANCELADA" }, desde: { lte: aFechaDb(dia) }, hasta: { gte: aFechaDb(dia) }, ...(modulo ? { modulo } : {}) }, busqueda)
}

/// Las mismas filas de Puerta para una lista de reservas (los resultados de una búsqueda),
/// en el orden de la lista.
export async function llegadasPorIds(ids: number[]) {
  if (!ids.length) return []
  const filas = await llegadasDonde({ id: { in: ids } })
  const porId = new Map(filas.map((fila) => [fila.id, fila]))
  return ids.flatMap((id) => porId.get(id) ?? [])
}

async function llegadasDonde(where: Prisma.ReservaWhereInput, busqueda = "") {
  const filas = await db().reserva.findMany({
    where,
    orderBy: [{ ingreso: "asc" }, { id: "asc" }],
    select: {
      id: true,
      codigo: true,
      modulo: true,
      estado: true,
      ingreso: true,
      salida: true,
      adultos: true,
      menores: true,
      sinCargo: true,
      total: true,
      institucion: true,
      hasta: true,
      ingresoEn: true,
      ingresoPor: true,
      salidaEn: true,
      adultosAdentro: true,
      menoresAdentro: true,
      detalle: true,
      token: true,
      desde: true,
      ticketEnviadoEn: true,
      personas: {
        orderBy: [{ familia: "asc" }, { id: "asc" }],
        select: { id: true, familia: true, responsable: true, nombre: true, apellido: true, dni: true, edad: true, notas: true, ingresoEn: true, salidaEn: true },
      },
      cliente: { select: { nombre: true, apellido: true, dni: true, telefono: true } },
      ocupaciones: { distinct: ["unidadId"], select: { unidad: { select: { tipo: true, etiqueta: true, numero: true } } } },
      pagos: { select: { importe: true, descuento: true, forma: true } },
    },
  })

  const texto = busqueda.trim().toLowerCase().replace(/^(n\.?\s*º?|#)\s*/, "")
  const numero = /^\d{1,7}$/.test(texto) ? Number(texto) : null
  const hoy = hoyEnElPredio()
  return filas
    .map((fila) => {
      const titular = fila.institucion ?? `${fila.cliente.nombre} ${fila.cliente.apellido}`
      const cotizacion = detalleDe(fila.detalle).cotizacion
      const aConfirmar = Boolean(cotizacion?.aConfirmar)
      const resumen = resumenDeAsistencia({ ...fila, hasta: deFechaDb(fila.hasta) }, hoy)
      return {
        ...resumen,
        id: fila.id,
        codigo: fila.codigo,
        modulo: fila.modulo,
        estado: fila.estado,
        visible: estadoVisible(fila.estado, resumen.asistencia),
        horario: `${fila.ingreso} a ${fila.salida}`,
        personas: fila.adultos + fila.menores + fila.sinCargo,
        titular,
        dni: fila.cliente.dni,
        lugares: fila.ocupaciones.map((item) => `${nombreDeUnidad[item.unidad.tipo]} ${item.unidad.etiqueta}`),
        unidades: fila.ocupaciones.map((item) => ({ tipo: item.unidad.tipo, numero: item.unidad.numero })),
        nombre: fila.cliente.nombre,
        telefono: fila.cliente.telefono,
        token: fila.token,
        desde: deFechaDb(fila.desde),
        hasta: deFechaDb(fila.hasta),
        ticketEnviadoEn: fila.ticketEnviadoEn,
        ingresoEn: fila.ingresoEn,
        ingresoPor: fila.ingresoPor,
        integrantes: fila.personas.map(({ ingresoEn, salidaEn, ...persona }) => ({ ...persona, estado: estadoDe({ ingresoEn, salidaEn }, deFechaDb(fila.hasta) < hoy) })),
        aConfirmar,
        consumo: Boolean(cotizacion?.consumo),
        saldo: aConfirmar ? null : saldoDe(fila.total, fila.pagos),
        cobrado: fila.pagos.reduce((suma, pago) => suma + pago.importe, 0),
        importeTotal: aConfirmar ? null : fila.total,
        cantidades: ingresaronPorCantidad(fila),
        efectivo: aConfirmar ? null : deudaDe(fila.total, fila.pagos).efectivo,
        buscable: [titular, fila.codigo, fila.cliente.dni ?? "", fila.cliente.apellido, ...fila.personas.map((persona) => `${persona.nombre} ${persona.apellido} ${persona.dni ?? ""}`)]
          .join(" ")
          .toLowerCase(),
      }
    })
    .filter((fila) => !texto || fila.id === numero || fila.buscable.includes(texto))
}

export type Llegada = Awaited<ReturnType<typeof llegadasDonde>>[number]

export async function pagosDelDia(dia: string) {
  return db().pago.findMany({
    where: { fecha: aFechaDb(dia) },
    orderBy: { creadoEn: "desc" },
    select: {
      id: true,
      importe: true,
      descuento: true,
      forma: true,
      registradoPor: true,
      creadoEn: true,
      reserva: { select: { id: true, codigo: true, institucion: true, cliente: { select: { nombre: true, apellido: true } } } },
    },
  })
}
