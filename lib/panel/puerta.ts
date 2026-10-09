import type { Modulo } from "@/generated/prisma/enums"
import { estadoDe, resumenDeAsistencia } from "@/lib/panel/asistencia"
import { saldoDe } from "@/lib/panel/cobros"
import { estadoVisible } from "@/lib/panel/estados"
import { deudaDe } from "@/lib/panel/libro-caja"
import { nombreDeUnidad } from "@/lib/panel/reservas"
import { aFechaDb, deFechaDb, hoyEnElPredio } from "@/lib/predio/fechas"
import { db } from "@/lib/prisma"
import { detalleDe } from "@/lib/reservas"

export async function llegadasDelDia(dia: string, busqueda = "", modulo?: Modulo) {
  const filas = await db().reserva.findMany({
    where: { estado: { not: "CANCELADA" }, desde: { lte: aFechaDb(dia) }, hasta: { gte: aFechaDb(dia) }, ...(modulo ? { modulo } : {}) },
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
      detalle: true,
      personas: {
        orderBy: [{ familia: "asc" }, { id: "asc" }],
        select: { id: true, familia: true, responsable: true, nombre: true, apellido: true, dni: true, edad: true, notas: true, ingresoEn: true, salidaEn: true },
      },
      cliente: { select: { nombre: true, apellido: true, dni: true } },
      ocupaciones: { distinct: ["unidadId"], select: { unidad: { select: { tipo: true, etiqueta: true } } } },
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
        ingresoEn: fila.ingresoEn,
        ingresoPor: fila.ingresoPor,
        integrantes: fila.personas.map(({ ingresoEn, salidaEn, ...persona }) => ({ ...persona, estado: estadoDe({ ingresoEn, salidaEn }, deFechaDb(fila.hasta) < hoy) })),
        aConfirmar,
        consumo: Boolean(cotizacion?.consumo),
        saldo: aConfirmar ? null : saldoDe(fila.total, fila.pagos),
        efectivo: aConfirmar ? null : deudaDe(fila.total, fila.pagos).efectivo,
        buscable: [titular, fila.codigo, fila.cliente.dni ?? "", fila.cliente.apellido, ...fila.personas.map((persona) => `${persona.nombre} ${persona.apellido} ${persona.dni ?? ""}`)]
          .join(" ")
          .toLowerCase(),
      }
    })
    .filter((fila) => !texto || fila.id === numero || fila.buscable.includes(texto))
}

export type Llegada = Awaited<ReturnType<typeof llegadasDelDia>>[number]

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
