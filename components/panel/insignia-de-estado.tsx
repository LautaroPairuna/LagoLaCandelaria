import { Ban, CalendarCheck, CircleCheck, CircleDashed, Clock, Flag, UserX, type LucideIcon } from "lucide-react"

import { estilosDeEstado, ordenDeEstados, type EstadoVisible } from "@/lib/panel/estados"
import { cn } from "cn"

const iconos: Record<EstadoVisible, LucideIcon> = {
  "a-confirmar": Clock,
  confirmada: CalendarCheck,
  parcial: CircleDashed,
  ingresada: CircleCheck,
  finalizada: Flag,
  "no-vino": UserX,
  cancelada: Ban,
}

/// El estado de la reserva con color, ícono y texto: no depende solo del color.
export function InsigniaDeEstado({ estado, grande = false, className }: { estado: EstadoVisible; grande?: boolean; className?: string }) {
  const Icono = iconos[estado]
  const estilo = estilosDeEstado[estado]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold whitespace-nowrap",
        grande ? "px-4 py-1.5 text-base" : "px-2.5 py-1 text-xs",
        estilo.insignia,
        className,
      )}
    >
      <Icono className={grande ? "size-5" : "size-3.5"} aria-hidden />
      {estilo.nombre}
    </span>
  )
}

export function LeyendaDeEstados({ estados = ordenDeEstados }: { estados?: EstadoVisible[] }) {
  return (
    <details className="rounded-2xl bg-white px-4 py-3 text-sm shadow-[0_8px_28px_rgba(58,42,24,0.06)]">
      <summary className="cursor-pointer font-semibold">¿Qué significa cada color?</summary>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {estados.map((estado) => (
          <li key={estado} className="flex items-center gap-3">
            <InsigniaDeEstado estado={estado} className="w-36 shrink-0 justify-start" />
            <span className="text-panel-muted">{estilosDeEstado[estado].explicacion}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}
