"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "cn"

const pestanas = [
  { href: "/panel/general", nombre: "Resumen y reportes" },
  { href: "/panel/general/usuarios", nombre: "Usuarios y permisos" },
]

export function PestanasGeneral() {
  const ruta = usePathname()
  return (
    <nav aria-label="Secciones del panel general" className="mt-4 flex gap-2">
      {pestanas.map((pestana) => {
        const activa = ruta === pestana.href
        return (
          <Link
            key={pestana.href}
            href={pestana.href}
            aria-current={activa ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold",
              activa ? "border-panel-ink bg-panel-ink text-white" : "border-panel-line bg-white hover:border-panel-muted",
            )}
          >
            {pestana.nombre}
          </Link>
        )
      })}
    </nav>
  )
}
