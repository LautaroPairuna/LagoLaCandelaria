"use client"

import { useState, useTransition } from "react"

import { cobrar } from "@/app/panel/puerta/acciones"
import { Button } from "@/components/ui/button"
import { avisarRevisar, conAviso } from "@/lib/avisos"
import { pesos } from "@/lib/predio/tarifas"

type Forma = "EFECTIVO" | "TRANSFERENCIA" | "DEBITO"
const nombreDeForma: Record<Forma, string> = { EFECTIVO: "efectivo", TRANSFERENCIA: "transferencia", DEBITO: "débito" }

/// Abre el cobro de una reserva con el saldo ya propuesto según la forma de pago.
export function CobrarPendiente({ id, titular, saldo, efectivo }: { id: number; titular: string; saldo: number; efectivo: number }) {
  const [abierto, setAbierto] = useState(false)
  const [forma, setForma] = useState<Forma>("EFECTIVO")
  const propuesto = forma === "EFECTIVO" ? efectivo : saldo
  const [importe, setImporte] = useState(String(efectivo))
  const [pendiente, iniciar] = useTransition()

  if (!abierto) {
    return (
      <Button type="button" variant="outline" className="h-10 px-4" onClick={() => setAbierto(true)}>
        Cobrar
      </Button>
    )
  }

  return (
    <form
      className="flex w-full flex-wrap items-end gap-2 rounded-2xl bg-panel p-3"
      onSubmit={(evento) => {
        evento.preventDefault()
        const monto = Number(importe.replace(/\D/g, ""))
        if (!monto) {
          avisarRevisar("Escribí cuánto vas a cobrar, en pesos y sin puntos.")
          return
        }
        if (!window.confirm(`¿Cobrar ${pesos(monto)} en ${nombreDeForma[forma]} a ${titular}?`)) return
        iniciar(async () => {
          const resultado = await conAviso(() => cobrar({ id, forma, importe: monto }), `Listo, quedaron cobrados ${pesos(monto)} a ${titular}.`)
          if (resultado.ok) setAbierto(false)
        })
      }}
    >
      <label className="text-sm font-semibold">
        Forma
        <select
          value={forma}
          onChange={(evento) => {
            const nueva = evento.target.value as Forma
            setForma(nueva)
            setImporte(String(nueva === "EFECTIVO" ? efectivo : saldo))
          }}
          className="mt-1 block h-10 rounded-lg border border-panel-line bg-white px-3"
        >
          <option value="EFECTIVO">Efectivo</option>
          <option value="TRANSFERENCIA">Transferencia</option>
          <option value="DEBITO">Débito</option>
        </select>
      </label>
      <label className="text-sm font-semibold">
        Importe
        <input value={importe} onChange={(evento) => setImporte(evento.target.value)} inputMode="numeric" className="mt-1 block h-10 w-32 rounded-lg border border-panel-line bg-white px-3" />
      </label>
      <Button type="submit" disabled={pendiente} className="h-10 bg-panel-naranja text-white hover:bg-panel-tostado">
        Cobrar
      </Button>
      <button type="button" className="h-10 text-sm text-panel-muted underline-offset-4 hover:underline" onClick={() => setAbierto(false)}>
        Cancelar
      </button>
      <p className="w-full text-xs text-panel-ink/70">
        {forma === "EFECTIVO"
          ? efectivo < saldo
            ? `Todo en efectivo: ${pesos(propuesto)} con el 10 % de descuento.`
            : "Ya entró una parte por banco: se cobra el precio de lista."
          : "Por banco se cobra el precio de lista, sin descuento."}
      </p>
    </form>
  )
}
