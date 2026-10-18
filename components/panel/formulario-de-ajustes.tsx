"use client"

import { useState, useTransition } from "react"

import { guardarAjustesDelPanel } from "@/app/panel/general/ajustes/acciones"
import { conAviso } from "@/lib/avisos"
import type { Ajustes } from "@/lib/ajustes"

const campo = "mt-1 block h-11 w-full rounded-xl border border-panel-line bg-white px-3 text-base text-panel-ink"

export function FormularioDeAjustes({ ajustes, palapasCargadas, palapasEnElPredio }: { ajustes: Ajustes; palapasCargadas: number; palapasEnElPredio: number }) {
  const [palapas, setPalapas] = useState(String(ajustes.palapasWeb))
  const [alias, setAlias] = useState(ajustes.aliasTransferencia)
  const [titular, setTitular] = useState(ajustes.titularTransferencia)
  const [pendiente, iniciar] = useTransition()

  function guardar(evento: React.FormEvent) {
    evento.preventDefault()
    iniciar(async () => {
      await conAviso(() => guardarAjustesDelPanel({ palapasWeb: Number(palapas), aliasTransferencia: alias, titularTransferencia: titular }), "Listo, se guardaron los ajustes.")
    })
  }

  return (
    <form onSubmit={guardar} className="space-y-6">
      <section className="rounded-3xl bg-white p-4 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:p-5">
        <h2 className="font-display text-2xl tracking-tight">Palapas que se reservan por la web</h2>
        <p className="mt-1 text-sm text-panel-muted">
          Se ofrecen las primeras de la lista (de la 1 en adelante). El resto queda para quienes llegan y las usan por orden de llegada. Hay {palapasEnElPredio} en el predio y{" "}
          {palapasCargadas} cargadas en el sistema.
        </p>
        <label className="mt-3 block max-w-xs text-sm font-semibold text-panel-muted">
          Cantidad
          <input type="number" min={0} max={palapasCargadas} inputMode="numeric" value={palapas} onChange={(evento) => setPalapas(evento.target.value)} className={campo} />
        </label>
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-[0_8px_28px_rgba(58,42,24,0.06)] md:p-5">
        <h2 className="font-display text-2xl tracking-tight">Transferencia de los bungalows</h2>
        <p className="mt-1 text-sm text-panel-muted">Los bungalows se pagan por adelantado. Estos datos se muestran en el ticket de la reserva.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-panel-muted">
            Alias o CBU
            <input value={alias} onChange={(evento) => setAlias(evento.target.value)} className={campo} placeholder="lago.candelaria" />
          </label>
          <label className="text-sm font-semibold text-panel-muted">
            A nombre de
            <input value={titular} onChange={(evento) => setTitular(evento.target.value)} className={campo} />
          </label>
        </div>
      </section>

      <button type="submit" disabled={pendiente} className="h-12 rounded-full bg-panel-ink px-6 font-semibold text-white hover:bg-panel-tostado disabled:opacity-60">
        {pendiente ? "Guardando…" : "Guardar ajustes"}
      </button>
    </form>
  )
}
