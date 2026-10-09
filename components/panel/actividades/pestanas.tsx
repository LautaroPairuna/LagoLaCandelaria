import { BarChart3 } from "lucide-react"
import Link from "next/link"

import type { ActividadConProfesor } from "@/lib/panel/actividades"
import { cn } from "cn"

/// Una pestaña por actividad a cargo; la administración ve todas y las estadísticas.
export function PestanasDeActividades({ actividades, activa, conEstadisticas }: { actividades: ActividadConProfesor[]; activa: string; conEstadisticas: boolean }) {
  const clase = (activo: boolean) => cn("shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold whitespace-nowrap", activo ? "bg-panel-ink text-white" : "hover:bg-panel")
  return (
    <nav aria-label="Actividades" className="mt-4 flex gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:inline-flex">
      {actividades.map((actividad) => (
        <Link key={actividad.slug} href={`/panel/actividades?actividad=${actividad.slug}`} aria-current={actividad.slug === activa ? "page" : undefined} className={clase(actividad.slug === activa)}>
          {actividad.nombre}
        </Link>
      ))}
      {conEstadisticas ? (
        <Link href="/panel/actividades/estadisticas" aria-current={activa === "estadisticas" ? "page" : undefined} className={cn(clase(activa === "estadisticas"), "inline-flex items-center gap-1.5")}>
          <BarChart3 className="size-4" aria-hidden />
          Estadísticas
        </Link>
      ) : null}
    </nav>
  )
}
