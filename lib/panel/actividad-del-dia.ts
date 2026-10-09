import { llegadasDelDia } from "@/lib/panel/puerta"
import { db } from "@/lib/prisma"

const hora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" })

/// Las reservas del día con sus integrantes y quién ya hizo la actividad. Primero las que
/// tienen gente adentro (las que el profesor puede atender), después las que no llegaron.
export async function actividadDelDia(actividad: string, fecha: string) {
  const llegadas = await llegadasDelDia(fecha)
  const ids = llegadas.map((llegada) => llegada.id)
  const hechas = ids.length
    ? await db().actividadRealizada.findMany({
        where: { actividad, reservaId: { in: ids } },
        select: { reservaId: true, personaId: true, cantidad: true, creadoEn: true, registradoPor: true },
      })
    : []

  const reservas = llegadas.map((llegada) => {
    const deLaReserva = hechas.filter((fila) => fila.reservaId === llegada.id)
    const porPersona = Object.fromEntries(
      deLaReserva.flatMap((fila) => (fila.personaId ? [[fila.personaId, { hora: hora.format(fila.creadoEn), por: fila.registradoPor }]] : [])),
    ) as Record<number, { hora: string; por: string | null }>
    const enGrupo = deLaReserva.find((fila) => fila.personaId === null)?.cantidad ?? 0
    return {
      id: llegada.id,
      codigo: llegada.codigo,
      titular: llegada.titular,
      visible: llegada.visible,
      lugares: llegada.lugares,
      personas: llegada.personas,
      adentro: llegada.adentro,
      conLista: llegada.integrantes.length > 0,
      integrantes: llegada.integrantes.map(({ id, familia, nombre, apellido, edad, notas, estado }) => ({ id, familia, nombre, apellido, edad, notas, estado })),
      hechas: porPersona,
      enGrupo,
      hicieron: Object.keys(porPersona).length + enGrupo,
    }
  })
  const orden = (reserva: (typeof reservas)[number]) => (reserva.adentro > 0 ? 0 : reserva.visible === "finalizada" || reserva.visible === "no-vino" ? 2 : 1)
  reservas.sort((a, b) => orden(a) - orden(b) || a.titular.localeCompare(b.titular))

  return {
    reservas,
    hicieron: reservas.reduce((suma, reserva) => suma + reserva.hicieron, 0),
    adentro: reservas.reduce((suma, reserva) => suma + reserva.adentro, 0),
    esperadas: reservas.reduce((suma, reserva) => suma + reserva.personas, 0),
  }
}

export type ReservaConActividad = Awaited<ReturnType<typeof actividadDelDia>>["reservas"][number]
