"use client"

import { ArrowUpDown, Filter } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { filtrosDeEstado, filtrosDeLugar, ordenes, sinFiltros, type FiltrosDePuerta } from "@/lib/panel/filtros-puerta"

const campo = "mt-1 block h-10 w-full rounded-xl border border-panel-line bg-white px-3 text-sm text-panel-ink"

/// Filtrar y ordenar las reservas del día. Cada cambio va a la dirección, así la lista
/// la arma el servidor y queda igual al recargar.
export function FiltrosDePuerta({ filtros }: { filtros: FiltrosDePuerta }) {
  const router = useRouter()
  const ruta = usePathname()
  const params = useSearchParams()

  function cambiar(clave: keyof FiltrosDePuerta, valor: string) {
    const nuevos = new URLSearchParams(params.toString())
    if (valor === sinFiltros[clave]) nuevos.delete(clave)
    else nuevos.set(clave, valor)
    router.replace(`${ruta}${nuevos.size ? `?${nuevos}` : ""}`, { scroll: false })
  }

  const filtrando = filtros.estado !== "todas" || filtros.lugar !== "todos"
  const selector = (clave: keyof FiltrosDePuerta, etiqueta: string, lista: readonly { id: string; nombre: string }[]) => (
    <label className="text-xs font-semibold text-panel-muted">
      {etiqueta}
      <select value={filtros[clave]} onChange={(evento) => cambiar(clave, evento.target.value)} className={campo}>
        {lista.map((opcion) => (
          <option key={opcion.id} value={opcion.id}>
            {opcion.nombre}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <div className="rounded-3xl bg-white p-4 shadow-[0_8px_28px_rgba(58,42,24,0.06)]">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <p className="col-span-2 flex items-center gap-2 text-sm font-bold md:hidden">
          <Filter className="size-4 text-panel-tostado" aria-hidden />
          Filtrar y ordenar
        </p>
        {selector("estado", "Estado", filtrosDeEstado)}
        {selector("lugar", "Ubicación", filtrosDeLugar)}
        <label className="text-xs font-semibold text-panel-muted">
          <span className="flex items-center gap-1">
            <ArrowUpDown className="size-3.5" aria-hidden />
            Ordenar
          </span>
          <select value={filtros.orden} onChange={(evento) => cambiar("orden", evento.target.value)} className={campo}>
            {ordenes.map((opcion) => (
              <option key={opcion.id} value={opcion.id}>
                {opcion.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>
      {filtrando ? (
        <button
          type="button"
          onClick={() => {
            const nuevos = new URLSearchParams(params.toString())
            for (const clave of ["estado", "lugar"]) nuevos.delete(clave)
            router.replace(`${ruta}${nuevos.size ? `?${nuevos}` : ""}`, { scroll: false })
          }}
          className="mt-3 text-sm font-semibold text-panel-tostado underline-offset-4 hover:underline"
        >
          Quitar filtros
        </button>
      ) : null}
    </div>
  )
}
