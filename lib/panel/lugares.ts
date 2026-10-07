import { saldoDe } from "@/lib/panel/cobros"
import { aFechaDb, deFechaDb } from "@/lib/predio/fechas"
import { gruposDeMesas, gruposDeParrillas, unidadesDelTipo, type TipoUnidad, type UnidadPredio } from "@/lib/predio/inventario"
import { db } from "@/lib/prisma"
import { detalleDe } from "@/lib/reservas"

export const zonas = [
  { id: "parrillas", nombre: "Parrillas" },
  { id: "quinchos", nombre: "Quinchos" },
  { id: "playa", nombre: "Playa" },
  { id: "bungalows", nombre: "Bungalows" },
  { id: "restaurante", nombre: "Restaurante" },
] as const

export type ZonaId = (typeof zonas)[number]["id"]

export type Seccion = { titulo: string; unidades: UnidadPredio[] }

const deTipo = (titulo: string, tipo: TipoUnidad): Seccion => ({ titulo, unidades: unidadesDelTipo(tipo) })

/// Cómo se agrupan los lugares en pantalla. Las parrillas van por capacidad para que se
/// vea enseguida si queda alguna del tamaño que hace falta.
export function seccionesDe(zona: ZonaId): Seccion[] {
  if (zona === "parrillas") {
    const parrillas = unidadesDelTipo("PARRILLA")
    return gruposDeParrillas.map((grupo) => ({
      titulo: `Para ${grupo.capacidad} personas · ${grupo.mesas} ${grupo.mesas === 1 ? "mesa" : "mesas"}`,
      unidades: parrillas.filter((unidad) => (grupo.numeros as readonly number[]).includes(unidad.numero)),
    }))
  }
  if (zona === "quinchos") return [deTipo("Quinchos", "QUINCHO")]
  if (zona === "playa") return [deTipo("Gazebos", "GAZEBO"), deTipo("Palapas", "PALAPA")]
  if (zona === "restaurante") {
    const mesas = unidadesDelTipo("MESA_RESTAURANTE")
    return gruposDeMesas.map((grupo) => ({
      titulo: `Mesas para ${grupo.capacidad} personas`,
      unidades: mesas.filter((unidad) => (grupo.numeros as readonly number[]).includes(unidad.numero)),
    }))
  }
  return [deTipo("Bungalows", "BUNGALOW")]
}

export function esZona(valor: string | undefined): valor is ZonaId {
  return zonas.some((zona) => zona.id === valor)
}

export async function ocupacionDeLugares(fecha: string) {
  const filas = await db().ocupacion.findMany({
    where: { fecha: aFechaDb(fecha), reserva: { estado: { not: "CANCELADA" } } },
    select: {
      unidadId: true,
      reserva: {
        select: {
          id: true,
          codigo: true,
          modulo: true,
          estado: true,
          desde: true,
          hasta: true,
          ingreso: true,
          salida: true,
          adultos: true,
          menores: true,
          sinCargo: true,
          total: true,
          institucion: true,
          ingresoEn: true,
          detalle: true,
          cliente: { select: { nombre: true, apellido: true, telefono: true } },
          pagos: { select: { importe: true, descuento: true } },
          ocupaciones: { where: { fecha: aFechaDb(fecha) }, select: { unidadId: true } },
        },
      },
    },
  })

  return new Map(
    filas.map(({ unidadId, reserva }) => [
      unidadId,
      {
        id: reserva.id,
        codigo: reserva.codigo,
        modulo: reserva.modulo,
        estado: reserva.estado,
        desde: deFechaDb(reserva.desde),
        hasta: deFechaDb(reserva.hasta),
        horario: `${reserva.ingreso} a ${reserva.salida}`,
        titular: reserva.institucion ?? `${reserva.cliente.nombre} ${reserva.cliente.apellido}`,
        telefono: reserva.cliente.telefono,
        personas: reserva.adultos + reserva.menores + reserva.sinCargo,
        aConfirmar: Boolean(detalleDe(reserva.detalle).cotizacion?.aConfirmar),
        saldo: saldoDe(reserva.total, reserva.pagos),
        ingreso: reserva.ingresoEn !== null,
        otrosLugares: reserva.ocupaciones.map((item) => item.unidadId).filter((id) => id !== unidadId),
      },
    ]),
  )
}

export type ReservaEnLugar = NonNullable<ReturnType<Awaited<ReturnType<typeof ocupacionDeLugares>>["get"]>>
