"use client"

import { ArrowRightLeft } from "lucide-react"
import { useState, useTransition } from "react"

import { lugaresParaReasignar, reasignarLugar, type LugarParaElegir, type LugaresParaReasignar } from "@/app/panel/reservas/lugares"
import { avisarError, conAviso, llamar } from "@/lib/avisos"
import { cn } from "cn"

const campo = "h-11 min-w-0 flex-1 rounded-xl border border-panel-line bg-white px-3 text-base text-panel-ink"
const boton = "inline-flex h-11 items-center justify-center rounded-xl bg-panel-ink px-4 text-sm font-bold text-white hover:bg-panel-tostado disabled:opacity-60"

/// Cambiar el lugar de una reserva que todavía no ingresó. Los lugares libres se piden
/// recién al abrirlo: son de ese momento y se vuelven a pedir después de cada cambio.
export function ReasignarLugar({ reservaId, className }: { reservaId: number; className?: string }) {
  const [lugares, setLugares] = useState<LugaresParaReasignar | null>(null)
  const [pendiente, iniciar] = useTransition()

  function cargar() {
    iniciar(async () => {
      const resultado = await llamar(() => lugaresParaReasignar(reservaId))
      if (resultado.ok) setLugares(resultado.lugares)
      else avisarError(resultado.error)
    })
  }

  function cambiar(desde: string | undefined, hacia: string, nombre: string) {
    iniciar(async () => {
      const resultado = await conAviso(() => reasignarLugar({ reservaId, desde, hacia }), `Listo, la reserva quedó en ${nombre}.`)
      if (resultado.ok) {
        const nuevos = await llamar(() => lugaresParaReasignar(reservaId))
        setLugares(nuevos.ok ? nuevos.lugares : null)
      }
    })
  }

  if (!lugares) {
    return (
      <button type="button" onClick={cargar} disabled={pendiente} className={cn("inline-flex items-center gap-2 text-sm font-semibold text-panel-tostado underline-offset-4 hover:underline disabled:opacity-60", className)}>
        <ArrowRightLeft className="size-4" aria-hidden />
        {pendiente ? "Buscando lugares libres…" : "Reasignar el lugar"}
      </button>
    )
  }

  return (
    <div className={cn("space-y-3 rounded-2xl bg-panel p-3", className)}>
      {lugares.actuales.map((actual) => (
        <Eleccion key={actual.id} etiqueta={`Cambiar ${actual.nombre} por`} opciones={actual.opciones} pendiente={pendiente} onElegir={(opcion) => cambiar(actual.id, opcion.id, opcion.nombre)} />
      ))}
      {lugares.actuales.length === 0 ? (
        lugares.paraAsignar.length ? (
          <Eleccion etiqueta="Asignar" opciones={lugares.paraAsignar} pendiente={pendiente} onElegir={(opcion) => cambiar(undefined, opcion.id, opcion.nombre)} />
        ) : (
          <p className="text-sm text-panel-muted">A esta reserva no se le asigna lugar desde acá.</p>
        )
      ) : null}
      <button type="button" onClick={() => setLugares(null)} className="text-sm font-semibold text-panel-muted hover:underline">
        Listo
      </button>
    </div>
  )
}

function Eleccion({ etiqueta, opciones, pendiente, onElegir }: { etiqueta: string; opciones: LugarParaElegir[]; pendiente: boolean; onElegir: (opcion: LugarParaElegir) => void }) {
  const [elegido, setElegido] = useState("")
  const opcion = opciones.find((item) => item.id === elegido)
  if (!opciones.length) return <p className="text-sm text-panel-muted">{etiqueta.replace(/ por$/, "")}: no hay otro lugar libre de ese tipo esos días.</p>
  return (
    <form
      className="space-y-1"
      onSubmit={(evento) => {
        evento.preventDefault()
        if (opcion) onElegir(opcion)
      }}
    >
      <label className="block text-sm font-semibold text-panel-muted">
        {etiqueta}
        <span className="mt-1 flex gap-2">
          <select value={elegido} onChange={(evento) => setElegido(evento.target.value)} className={campo}>
            <option value="">Elegí un lugar libre</option>
            {opciones.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
                {item.capacidad ? ` · hasta ${item.capacidad}` : ""}
              </option>
            ))}
          </select>
          <button type="submit" disabled={pendiente || !opcion} className={boton}>
            Cambiar
          </button>
        </span>
      </label>
    </form>
  )
}
