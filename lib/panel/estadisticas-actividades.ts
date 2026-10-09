import { rankingDeActividades } from "@/lib/panel/actividades"
import { aFechaDb, deFechaDb, fechasEntre } from "@/lib/predio/fechas"
import { db } from "@/lib/prisma"

/// Junta los días en tramos para el gráfico: día por día hasta dos meses; después, por semana.
export function porTramos(dias: string[], cantidades: Map<string, number>) {
  if (dias.length <= 62) return dias.map((dia) => ({ desde: dia, hasta: dia, cantidad: cantidades.get(dia) ?? 0 }))
  const tramos: { desde: string; hasta: string; cantidad: number }[] = []
  for (let indice = 0; indice < dias.length; indice += 7) {
    const semana = dias.slice(indice, indice + 7)
    tramos.push({ desde: semana[0], hasta: semana.at(-1)!, cantidad: semana.reduce((suma, dia) => suma + (cantidades.get(dia) ?? 0), 0) })
  }
  return tramos
}

export async function estadisticasDeActividades(desde: string, hasta: string) {
  const entre = { gte: aFechaDb(desde), lte: aFechaDb(hasta) }
  const [porActividad, porDia, porProfesor, ingresadas] = await Promise.all([
    db().actividadRealizada.groupBy({ by: ["actividad"], where: { fecha: entre }, _sum: { cantidad: true } }),
    db().actividadRealizada.groupBy({ by: ["fecha"], where: { fecha: entre }, _sum: { cantidad: true } }),
    db().actividadRealizada.groupBy({ by: ["registradoPor", "actividad"], where: { fecha: entre }, _sum: { cantidad: true } }),
    db().reserva.findMany({
      where: { estado: { not: "CANCELADA" }, ingresoEn: { not: null }, desde: { lte: aFechaDb(hasta) }, hasta: { gte: aFechaDb(desde) } },
      select: { adultos: true, menores: true, sinCargo: true },
    }),
  ])
  const visitantes = ingresadas.reduce((suma, fila) => suma + fila.adultos + fila.menores + fila.sinCargo, 0)
  const ranking = rankingDeActividades(
    porActividad.map((fila) => ({ actividad: fila.actividad, cantidad: fila._sum.cantidad ?? 0 })),
    visitantes,
  )
  const total = ranking.reduce((suma, fila) => suma + fila.cantidad, 0)
  const cantidades = new Map(porDia.map((fila) => [deFechaDb(fila.fecha), fila._sum.cantidad ?? 0]))
  const profesores = new Map<string, { nombre: string; total: number; actividades: Set<string> }>()
  for (const fila of porProfesor) {
    const nombre = fila.registradoPor ?? "Sin registrar"
    const actual = profesores.get(nombre) ?? { nombre, total: 0, actividades: new Set<string>() }
    actual.total += fila._sum.cantidad ?? 0
    actual.actividades.add(fila.actividad)
    profesores.set(nombre, actual)
  }
  return {
    total,
    visitantes,
    ranking,
    tramos: porTramos(fechasEntre(desde, hasta), cantidades),
    profesores: [...profesores.values()].map((fila) => ({ ...fila, actividades: [...fila.actividades] })).sort((a, b) => b.total - a.total),
  }
}
