import { activities } from "@/lib/activities"

// Las actividades que tienen profesor y se marcan persona por persona. Con la entrada,
// cada persona puede hacer cada una una sola vez por visita. Para sumar o sacar una,
// alcanza con cambiar esta lista (el slug es el del catálogo de actividades).
const conProfesor = ["canotaje", "tirolesa", "parque-aereo", "palestra", "pendulo", "caminata"] as const

export type ActividadConProfesor = { slug: string; nombre: string }

export const actividadesConProfesor: ActividadConProfesor[] = conProfesor.map((slug) => {
  const actividad = activities.find((item) => item.slug === slug)
  return { slug, nombre: actividad?.name ?? slug }
})

export function esActividadConProfesor(slug: string | undefined): slug is string {
  return actividadesConProfesor.some((actividad) => actividad.slug === slug)
}

export function nombreDeActividad(slug: string) {
  return actividadesConProfesor.find((actividad) => actividad.slug === slug)?.nombre ?? slug
}

/// Ranking de actividades del período: cuántas veces se hizo cada una y qué parte de
/// los visitantes la hizo. Las que no se hicieron aparecen igual, con cero.
export function rankingDeActividades(conteos: { actividad: string; cantidad: number }[], visitantes: number) {
  const totales = new Map<string, number>()
  for (const fila of conteos) totales.set(fila.actividad, (totales.get(fila.actividad) ?? 0) + fila.cantidad)
  return actividadesConProfesor
    .map((actividad) => {
      const cantidad = totales.get(actividad.slug) ?? 0
      return { ...actividad, cantidad, porcentaje: visitantes ? Math.round((cantidad / visitantes) * 100) : 0 }
    })
    .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre))
}
