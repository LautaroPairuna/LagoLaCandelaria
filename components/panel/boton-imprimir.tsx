"use client"

import { Printer } from "lucide-react"

export function BotonImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-11 items-center gap-2 rounded-full bg-panel-ink px-5 text-sm font-semibold text-white hover:bg-panel-tostado"
    >
      <Printer className="size-4" aria-hidden />
      Imprimir
    </button>
  )
}
