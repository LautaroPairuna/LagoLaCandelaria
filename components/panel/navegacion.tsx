"use client"

import { CalendarCheck, CalendarRange, DoorOpen, LayoutGrid, MapPin, Martini, UtensilsCrossed, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import type { PanelId } from "@/lib/panel/roles"
import { cn } from "cn"

const iconos: Record<PanelId, LucideIcon> = {
  ocupacion: CalendarRange,
  reservas: CalendarCheck,
  lugares: MapPin,
  puerta: DoorOpen,
  bar: Martini,
  restaurante: UtensilsCrossed,
  general: LayoutGrid,
}

export function NavegacionPanel({ paneles }: { paneles: { id: PanelId; nombre: string; href: string; listo: boolean }[] }) {
  const ruta = usePathname()

  return (
    <nav aria-label="Paneles" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {paneles.map((panel) => {
        const Icono = iconos[panel.id]
        const activo = ruta.startsWith(panel.href)
        const clases = "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold"
        if (!panel.listo) {
          return (
            <span key={panel.id} className={cn(clases, "cursor-default text-white/45")} aria-disabled>
              <Icono className="size-4" aria-hidden />
              {panel.nombre}
              <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] tracking-wide uppercase">Pronto</span>
            </span>
          )
        }
        return (
          <Link
            key={panel.id}
            href={panel.href}
            aria-current={activo ? "page" : undefined}
            className={cn(clases, activo ? "bg-white text-panel-ink" : "text-white/85 hover:bg-white/10")}
          >
            <Icono className="size-4" aria-hidden />
            {panel.nombre}
          </Link>
        )
      })}
    </nav>
  )
}
