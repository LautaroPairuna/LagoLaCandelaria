"use client"

import { Check, Flame, Home, Umbrella, UtensilsCrossed, Warehouse } from "lucide-react"

import { Aviso } from "@/components/reserva/campo"
import type { TipoLugar } from "@/lib/inventario"
import { cn } from "cn"

export type FichaLugar = {
  id: string
  nombre: string
  capacidad: number
}

const icono: Record<TipoLugar | "mesa", typeof Flame> = {
  parrilla: Flame,
  gazebo: Home,
  quincho: Warehouse,
  palapa: Umbrella,
  bungalow: Home,
  mesa: UtensilsCrossed,
}

const fondo: Record<TipoLugar | "mesa", string> = {
  parrilla: "bg-[#f8efe4]",
  gazebo: "bg-[#e7f4dc]",
  quincho: "bg-[#f3ead7]",
  palapa: "bg-[#f8e7c4]",
  bungalow: "bg-[#e5f2ea]",
  mesa: "bg-[#f7f1e6]",
}

export function GrillaUnidades({
  tipo,
  titulo,
  explica,
  ayuda,
  aviso,
  listo,
  items,
  seleccion,
  ocupados,
  onToggle,
  bloqueado,
}: {
  tipo: TipoLugar | "mesa"
  titulo: string
  explica: string
  ayuda?: string
  aviso?: string | null
  listo?: string | null
  items: FichaLugar[]
  seleccion: string[]
  ocupados: string[]
  onToggle: (id: string) => void
  bloqueado?: string
}) {
  const Icono = icono[tipo]
  const redonda = tipo === "palapa"

  return (
    <section className={cn("rounded-[1.6rem] p-4 md:p-5", fondo[tipo])}>
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-lake-ink">
          <Icono />
        </span>
        <div>
          <h3 className="font-display text-3xl tracking-tight">{titulo}</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink/75">{explica}</p>
        </div>
      </div>

      {ayuda ? <p className="mt-4 text-sm font-semibold text-ink">{ayuda}</p> : null}

      {bloqueado ? (
        <p className="mt-4 rounded-2xl bg-white/80 px-4 py-3 text-sm leading-relaxed text-ink/80">{bloqueado}</p>
      ) : (
        <ul
          className={cn(
            "mt-4 grid gap-3",
            redonda ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4",
            tipo === "quincho" && "sm:grid-cols-1",
          )}
        >
          {items.map((item) => {
            const ocupado = ocupados.includes(item.id)
            const elegido = seleccion.includes(item.id)
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={ocupado}
                  aria-pressed={elegido}
                  onClick={() => onToggle(item.id)}
                  className={cn(
                    "flex h-full min-h-28 w-full flex-col justify-between border-2 px-3 py-3 text-left transition",
                    redonda ? "rounded-full px-4 text-center" : "rounded-2xl",
                    tipo === "quincho" && "min-h-36",
                    ocupado && "cursor-not-allowed border-ink/10 bg-white/40 text-ink/35",
                    elegido && "border-orange bg-orange text-white",
                    !ocupado && !elegido && "border-orange bg-white text-ink hover:bg-[#fff7f0]",
                  )}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className={cn("font-display text-xl tracking-tight", redonda && "w-full")}>
                      {item.nombre.charAt(0).toUpperCase() + item.nombre.slice(1)}
                    </span>
                    {elegido ? <Check className="size-4 text-white" aria-hidden /> : null}
                  </span>
                  <span className="mt-3 text-sm">
                    {ocupado ? "Ocupado" : `${item.capacidad} personas`}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {tipo === "bungalow" && !bloqueado ? (
        <div className="mt-4 h-8 rounded-full bg-lake/80" aria-hidden />
      ) : null}

      {aviso ? (
        <div className="mt-4">
          <Aviso>{aviso}</Aviso>
        </div>
      ) : null}
      {listo ? (
        <div className="mt-4">
          <Aviso tono="ok">{listo}</Aviso>
        </div>
      ) : null}
    </section>
  )
}
