import { llegadasDelDia } from "@/lib/panel/puerta"
import { bloquesPorMesa } from "@/lib/panel/salon"
import { aFechaDb } from "@/lib/predio/fechas"
import { unidadesDelTipo } from "@/lib/predio/inventario"
import { db } from "@/lib/prisma"

/// Las reservas de mesa de un día y cómo quedan repartidas en el salón por horario.
export async function restauranteDelDia(fecha: string) {
  const [reservas, filas] = await Promise.all([
    llegadasDelDia(fecha, "", "RESTAURANTE"),
    db().ocupacion.findMany({
      where: { fecha: aFechaDb(fecha), unidad: { tipo: "MESA_RESTAURANTE" }, reserva: { estado: { not: "CANCELADA" } } },
      select: { unidadId: true, reservaId: true, hora: true },
    }),
  ])
  return {
    reservas: reservas.sort((a, b) => a.horario.localeCompare(b.horario) || a.id - b.id),
    mesas: unidadesDelTipo("MESA_RESTAURANTE"),
    bloques: bloquesPorMesa(filas),
  }
}

export type ReservaDeMesa = Awaited<ReturnType<typeof restauranteDelDia>>["reservas"][number]
