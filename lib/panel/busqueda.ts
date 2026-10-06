import type { EstadoReserva, Prisma } from "@/generated/prisma/client"
import { saldoDe } from "@/lib/panel/cobros"
import { lineas, nombreDeUnidad, type LineaId } from "@/lib/panel/reservas"
import { aFechaDb, deFechaDb } from "@/lib/predio/fechas"
import { db } from "@/lib/prisma"
import { detalleDe } from "@/lib/reservas"

export const POR_PAGINA = 50

export type FiltroDeEstado = "activas" | "PENDIENTE" | "CONFIRMADA" | "CANCELADA"

export type Busqueda = {
  texto: string
  fecha?: string
  estado: FiltroDeEstado
  linea?: LineaId
  pasadas: boolean
  hoy: string
}

/// Arma la condición del texto libre. Un número busca por número de reserva, DNI o
/// teléfono; "LC-…" por código; las palabras, en nombres, apellidos e institución
/// (todas tienen que aparecer, en cualquier orden).
export function condicionDeTexto(texto: string): Prisma.ReservaWhereInput | null {
  const limpio = texto.trim().replace(/^(n\.?\s*º?|#)\s*/i, "")
  if (!limpio) return null

  if (/^\d+$/.test(limpio)) {
    const numero = Number(limpio)
    return {
      OR: [
        ...(limpio.length <= 7 ? [{ id: numero }] : []),
        { cliente: { dni: { contains: limpio } } },
        { cliente: { telefono: { contains: limpio } } },
        { personas: { some: { dni: { contains: limpio } } } },
      ],
    }
  }

  if (/^lc-?[a-z0-9]{1,6}$/i.test(limpio)) {
    return { codigo: { contains: limpio.toUpperCase().replace(/^LC-?/, "LC-") } }
  }

  const palabras = limpio.split(/\s+/).slice(0, 5)
  return {
    AND: palabras.map((palabra) => ({
      OR: [
        { cliente: { nombre: { contains: palabra } } },
        { cliente: { apellido: { contains: palabra } } },
        { institucion: { contains: palabra } },
        { personas: { some: { OR: [{ nombre: { contains: palabra } }, { apellido: { contains: palabra } }] } } },
      ],
    })),
  }
}

export function condicionDeBusqueda({ texto, fecha, estado, linea, pasadas, hoy }: Busqueda): Prisma.ReservaWhereInput {
  const condiciones: Prisma.ReservaWhereInput[] = []
  const deTexto = condicionDeTexto(texto)
  if (deTexto) condiciones.push(deTexto)
  if (fecha) condiciones.push({ desde: { lte: aFechaDb(fecha) }, hasta: { gte: aFechaDb(fecha) } })
  else if (!pasadas) condiciones.push({ hasta: { gte: aFechaDb(hoy) } })
  condiciones.push(estado === "activas" ? { estado: { not: "CANCELADA" } } : { estado: estado as EstadoReserva })
  if (linea) condiciones.push({ modulo: { in: [...lineas.find((item) => item.id === linea)!.modulos] } })
  return { AND: condiciones }
}

export async function buscarReservas(busqueda: Busqueda, cantidad = POR_PAGINA) {
  const where = condicionDeBusqueda(busqueda)
  const [total, filas] = await Promise.all([
    db().reserva.count({ where }),
    db().reserva.findMany({
      where,
      take: cantidad,
      orderBy: busqueda.pasadas && !busqueda.fecha ? [{ desde: "desc" }, { id: "desc" }] : [{ desde: "asc" }, { id: "asc" }],
      select: {
        id: true,
        codigo: true,
        modulo: true,
        estado: true,
        desde: true,
        hasta: true,
        adultos: true,
        menores: true,
        sinCargo: true,
        total: true,
        institucion: true,
        ingresoEn: true,
        detalle: true,
        cliente: { select: { nombre: true, apellido: true, telefono: true } },
        ocupaciones: { distinct: ["unidadId"], select: { unidad: { select: { tipo: true, etiqueta: true } } } },
        pagos: { select: { importe: true, descuento: true } },
      },
    }),
  ])

  return {
    total,
    filas: filas.map((fila) => ({
      id: fila.id,
      codigo: fila.codigo,
      modulo: fila.modulo,
      estado: fila.estado,
      desde: deFechaDb(fila.desde),
      hasta: deFechaDb(fila.hasta),
      titular: fila.institucion ?? `${fila.cliente.nombre} ${fila.cliente.apellido}`,
      contacto: fila.institucion ? `${fila.cliente.nombre} ${fila.cliente.apellido}` : null,
      telefono: fila.cliente.telefono,
      personas: fila.adultos + fila.menores + fila.sinCargo,
      lugares: fila.ocupaciones.map(({ unidad }) => `${nombreDeUnidad[unidad.tipo]} ${unidad.etiqueta}`),
      aConfirmar: Boolean(detalleDe(fila.detalle).cotizacion?.aConfirmar),
      saldo: saldoDe(fila.total, fila.pagos),
      ingreso: fila.ingresoEn !== null,
    })),
  }
}

export type FilaDeBusqueda = Awaited<ReturnType<typeof buscarReservas>>["filas"][number]

export async function contarPasadas(busqueda: Busqueda) {
  return db().reserva.count({ where: condicionDeBusqueda({ ...busqueda, pasadas: true }) })
}
