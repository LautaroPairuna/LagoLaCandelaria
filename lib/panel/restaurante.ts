import { llegadasDelDia } from "@/lib/panel/puerta"
import { bloquesPorMesa } from "@/lib/panel/salon"
import { aFechaDb } from "@/lib/predio/fechas"
import { textoDeHora } from "@/lib/predio/horario"
import { unidadesDelTipo } from "@/lib/predio/inventario"
import { db } from "@/lib/prisma"

/// Las reservas de mesa de un día y cómo quedan repartidas en el salón por horario.
/// Entran las de mesa y también las del predio que sumaron una mesa del restaurante.
export async function restauranteDelDia(fecha: string) {
  const [llegadas, filas] = await Promise.all([
    llegadasDelDia(fecha, ""),
    db().ocupacion.findMany({
      where: { fecha: aFechaDb(fecha), unidad: { tipo: "MESA_RESTAURANTE" }, reserva: { estado: { not: "CANCELADA" } } },
      select: { unidadId: true, reservaId: true, hora: true },
    }),
  ])
  const conMesa = new Set(filas.map((fila) => fila.reservaId))
  const reservas = llegadas
    .filter((reserva) => reserva.modulo === "RESTAURANTE" || conMesa.has(reserva.id))
    .map((reserva) => {
      if (reserva.modulo === "RESTAURANTE") return reserva
      // Las del predio traen el horario del día: en el salón importa el de la mesa.
      const horas = filas.filter((fila) => fila.reservaId === reserva.id && fila.hora > 0).map((fila) => fila.hora)
      return horas.length ? { ...reserva, horario: `${textoDeHora(Math.min(...horas))} a ${textoDeHora(Math.max(...horas) + 1)}` } : reserva
    })
  return {
    reservas: reservas.sort((a, b) => a.horario.localeCompare(b.horario) || a.id - b.id),
    mesas: unidadesDelTipo("MESA_RESTAURANTE"),
    bloques: bloquesPorMesa(filas),
  }
}

export type ReservaDeMesa = Awaited<ReturnType<typeof restauranteDelDia>>["reservas"][number]
