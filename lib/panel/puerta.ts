import { saldoDe } from "@/lib/panel/cobros"
import { nombreDeUnidad } from "@/lib/panel/reservas"
import { aFechaDb } from "@/lib/predio/fechas"
import { db } from "@/lib/prisma"
import { detalleDe } from "@/lib/reservas"

export async function llegadasDelDia(dia: string, busqueda = "") {
  const filas = await db().reserva.findMany({
    where: { estado: { not: "CANCELADA" }, desde: { lte: aFechaDb(dia) }, hasta: { gte: aFechaDb(dia) } },
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
      ingresoEn: true,
      ingresoPor: true,
      detalle: true,
      cliente: { select: { nombre: true, apellido: true, dni: true } },
      ocupaciones: { distinct: ["unidadId"], select: { unidad: { select: { tipo: true, etiqueta: true } } } },
      pagos: { select: { importe: true, descuento: true } },
    },
  })

  const texto = busqueda.trim().toLowerCase()
  return filas
    .map((fila) => {
      const titular = fila.institucion ?? `${fila.cliente.nombre} ${fila.cliente.apellido}`
      const aConfirmar = Boolean(detalleDe(fila.detalle).cotizacion?.aConfirmar)
      return {
        id: fila.id,
        codigo: fila.codigo,
        modulo: fila.modulo,
        estado: fila.estado,
        horario: `${fila.ingreso} a ${fila.salida}`,
        personas: fila.adultos + fila.menores + fila.sinCargo,
        titular,
        dni: fila.cliente.dni,
        lugares: fila.ocupaciones.map((item) => `${nombreDeUnidad[item.unidad.tipo]} ${item.unidad.etiqueta}`),
        ingresoEn: fila.ingresoEn,
        ingresoPor: fila.ingresoPor,
        aConfirmar,
        saldo: aConfirmar ? null : saldoDe(fila.total, fila.pagos),
        buscable: [titular, fila.codigo, fila.cliente.dni ?? "", fila.cliente.apellido].join(" ").toLowerCase(),
      }
    })
    .filter((fila) => !texto || fila.buscable.includes(texto))
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
