import Link from "next/link"

import type { DatosDelLocal } from "@/lib/panel/local"
import { cn } from "cn"

export type Pestana = "salon" | "cuentas" | "menu" | "caja"

export function rutasDelLocal(local: DatosDelLocal): { id: Pestana; nombre: string; href: string }[] {
  if (local.id === "RESTAURANTE") {
    return [
      { id: "salon", nombre: "Salón y reservas", href: local.base },
      { id: "cuentas", nombre: "Cuentas", href: `${local.base}/cuentas` },
      { id: "menu", nombre: "Menú", href: `${local.base}/menu` },
      { id: "caja", nombre: "Caja", href: `${local.base}/caja` },
    ]
  }
  return [
    { id: "cuentas", nombre: "Cuentas", href: local.base },
    { id: "menu", nombre: "Menú", href: `${local.base}/menu` },
    { id: "caja", nombre: "Caja", href: `${local.base}/caja` },
  ]
}

/// Las pestañas internas de restaurante y bar.
export function PestanasDelLocal({ local, activa }: { local: DatosDelLocal; activa: Pestana }) {
  return (
    <nav aria-label={`Secciones de ${local.nombre.toLowerCase()}`} className="mt-4 flex gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:inline-flex">
      {rutasDelLocal(local).map((ruta) => (
        <Link
          key={ruta.id}
          href={ruta.href}
          aria-current={ruta.id === activa ? "page" : undefined}
          className={cn(
            "shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold whitespace-nowrap",
            ruta.id === activa ? "bg-panel-ink text-white" : "text-panel-ink hover:bg-panel",
          )}
        >
          {ruta.nombre}
        </Link>
      ))}
    </nav>
  )
}
