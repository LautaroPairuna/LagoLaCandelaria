import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

import { ElegirFecha } from "@/components/panel/elegir-fecha"
import { fechaLargaPanel } from "@/lib/panel/formato"
import { sumarDiasIso } from "@/lib/predio/fechas"

/// El día de una pantalla de Puerta, con flechas y calendario.
export function EncabezadoDelDia({ fecha, hoy, ruta, kicker }: { fecha: string; hoy: string; ruta: string; kicker: string }) {
  const enlace = (dia: string) => (dia === hoy ? ruta : `${ruta}?fecha=${dia}`)
  return (
    <header>
      <div className="flex items-center justify-between gap-3 md:justify-start md:gap-4">
        <p className="text-xs font-bold tracking-[0.16em] text-panel-naranja uppercase">{kicker}</p>
        {fecha !== hoy ? (
          <Link href={ruta} className="shrink-0 rounded-full border border-panel-line bg-white px-3 py-1 text-sm font-semibold hover:border-panel-muted">
            Hoy
          </Link>
        ) : null}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-2 md:mt-2 md:gap-x-2">
        <Link href={enlace(sumarDiasIso(fecha, -1))} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-panel-line md:size-11" aria-label="Día anterior">
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <h1 className="font-display min-w-0 text-center text-2xl leading-tight tracking-tight md:text-4xl">{fechaLargaPanel(fecha)}</h1>
        <Link href={enlace(sumarDiasIso(fecha, 1))} className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-panel-line md:size-11" aria-label="Día siguiente">
          <ChevronRight className="size-5" aria-hidden />
        </Link>
        <ElegirFecha fecha={fecha} />
      </div>
    </header>
  )
}
