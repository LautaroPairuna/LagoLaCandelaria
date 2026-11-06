import Link from "next/link"

import { cn } from "cn"

export type PestanaDePuerta = "reservas" | "lugares" | "caja" | "general"

/// Las pestañas de Puerta. El día elegido viaja de una a otra.
export function PestanasDePuerta({ activa, fecha }: { activa: PestanaDePuerta; fecha?: string }) {
  const conFecha = (ruta: string, clave: "fecha" | "desde") => (fecha ? `${ruta}?${clave === "desde" ? `desde=${fecha}&hasta=${fecha}` : `fecha=${fecha}`}` : ruta)
  const pestanas: { id: PestanaDePuerta; nombre: string; href: string }[] = [
    { id: "reservas", nombre: "Reservas", href: conFecha("/panel/puerta", "fecha") },
    { id: "lugares", nombre: "Lugares", href: conFecha("/panel/puerta/lugares", "fecha") },
    { id: "caja", nombre: "Caja", href: conFecha("/panel/puerta/caja", "desde") },
    { id: "general", nombre: "General", href: conFecha("/panel/puerta/general", "fecha") },
  ]
  return (
    <nav aria-label="Secciones de Puerta" className="mt-4 flex gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:inline-flex">
      {pestanas.map((pestana) => (
        <Link
          key={pestana.id}
          href={pestana.href}
          aria-current={pestana.id === activa ? "page" : undefined}
          className={cn(
            "shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold whitespace-nowrap",
            pestana.id === activa ? "bg-panel-ink text-white" : "text-panel-ink hover:bg-panel",
          )}
        >
          {pestana.nombre}
        </Link>
      ))}
    </nav>
  )
}
