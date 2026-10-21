import { ArrowRight, MessageCircle } from "lucide-react"
import Link from "next/link"

import { Foto } from "@/components/foto"
import { cn } from "cn"

export type Pieza = {
  id: string
  nombre: string
  detalle: string
  foto: string
  href: string
  externo?: boolean
  etiqueta?: string
}

/// Grilla de fotos grandes para elegir una visita. `partido` deja dos caminos, uno al lado del otro.
export function Escenario({ piezas, partido = false }: { piezas: Pieza[]; partido?: boolean }) {
  return (
    <ul className={cn("grid gap-4", partido ? "md:grid-cols-2" : "sm:grid-cols-2")}>
      {piezas.map((pieza, indice) => (
        <li key={pieza.id}>
          <Link
            href={pieza.href}
            target={pieza.externo ? "_blank" : undefined}
            rel={pieza.externo ? "noreferrer" : undefined}
            className={cn(
              "portal-rise group relative flex overflow-hidden rounded-[1.7rem] text-cream shadow-[0_18px_44px_rgba(42,32,22,0.16)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange",
              partido ? "min-h-[26rem] md:min-h-[34rem]" : "min-h-[22rem] md:min-h-[28rem]",
            )}
            style={{ animationDelay: `${indice * 70}ms` }}
          >
            <Foto
              src={pieza.foto}
              alt=""
              sizes={partido ? "(min-width: 768px) 46vw, 100vw" : "(min-width: 640px) 46vw, 100vw"}
              className="absolute inset-0 size-full object-cover transition duration-700 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/15 transition duration-500 group-hover:via-black/30" />
            <span className="relative mt-auto flex w-full flex-col p-5 md:p-7">
              {pieza.etiqueta ? <span className="text-xs font-bold tracking-[0.18em] text-cream/80 uppercase">{pieza.etiqueta}</span> : null}
              <span className="font-display mt-2 flex items-end justify-between gap-4 text-[2.1rem] leading-[0.95] tracking-tight md:text-5xl">
                {pieza.nombre}
                <span className="mb-1 grid size-11 shrink-0 place-items-center rounded-full bg-orange text-sobre-naranja transition duration-300 group-hover:translate-x-1">
                  {pieza.externo ? <MessageCircle className="size-5" aria-hidden /> : <ArrowRight className="size-5" aria-hidden />}
                </span>
              </span>
              <span className="mt-3 max-w-md text-base leading-relaxed text-cream/90 md:text-lg">{pieza.detalle}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
