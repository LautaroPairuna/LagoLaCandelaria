"use client"

import { ChevronDown } from "lucide-react"
import { useState, type ReactNode } from "react"

import { cn } from "cn"

/// Una fila de tabla con su detalle debajo (en Puerta, el ingreso y el cobro), que se abre
/// con el botón de la última columna.
export function FilaDesplegable({ celdas, detalle, columnas, clase, etiqueta }: { celdas: ReactNode; detalle: ReactNode; columnas: number; clase?: string; etiqueta: string }) {
  const [abierta, setAbierta] = useState(false)
  return (
    <>
      <tr className={clase}>
        {celdas}
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            aria-expanded={abierta}
            aria-label={`${abierta ? "Cerrar" : "Abrir"} ingreso y cobro de ${etiqueta}`}
            onClick={() => setAbierta(!abierta)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-panel-line bg-white px-3 text-sm font-semibold whitespace-nowrap hover:border-panel-muted"
          >
            Ingreso y cobro
            <ChevronDown className={cn("size-4 transition", abierta && "rotate-180")} aria-hidden />
          </button>
        </td>
      </tr>
      {abierta ? (
        <tr className={clase}>
          <td colSpan={columnas} className="px-5 pt-1 pb-5">
            {detalle}
          </td>
        </tr>
      ) : null}
    </>
  )
}
