"use client"

import { Minus, Plus } from "lucide-react"

export function Contador({
  etiqueta,
  detalle,
  valor,
  minimo = 0,
  maximo = 99,
  onChange,
}: {
  etiqueta: string
  detalle: string
  valor: number
  minimo?: number
  maximo?: number
  onChange: (valor: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white px-4 py-3">
      <div>
        <p className="font-semibold">{etiqueta}</p>
        <p className="text-sm text-ink/60">{detalle}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Restar ${etiqueta.toLowerCase()}`}
          disabled={valor <= minimo}
          className="grid size-10 place-items-center rounded-full border border-ink/15 disabled:opacity-30"
          onClick={() => onChange(valor - 1)}
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <span className="w-8 text-center font-display text-2xl tabular-nums" aria-live="polite">
          {valor}
        </span>
        <button
          type="button"
          aria-label={`Sumar ${etiqueta.toLowerCase()}`}
          disabled={valor >= maximo}
          className="grid size-10 place-items-center rounded-full border border-orange bg-orange text-sobre-naranja disabled:opacity-30"
          onClick={() => onChange(valor + 1)}
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
