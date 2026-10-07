"use client"

import { Trash2 } from "lucide-react"
import { useTransition } from "react"

import { borrarMovimiento } from "@/app/panel/caja/acciones"
import { conAviso } from "@/lib/avisos"

export function BorrarMovimiento({ id, descripcion }: { id: number; descripcion: string }) {
  const [pendiente, iniciar] = useTransition()
  return (
    <button
      type="button"
      disabled={pendiente}
      aria-label={`Borrar ${descripcion}`}
      title="Borrar este movimiento"
      className="grid size-9 place-items-center rounded-full text-panel-muted hover:bg-[#fde9e7] hover:text-[#c62828] disabled:opacity-50"
      onClick={() => {
        if (!window.confirm(`¿Borrar ${descripcion}? Queda registrado en la actividad.`)) return
        iniciar(async () => void (await conAviso(() => borrarMovimiento({ id }), "Listo, se borró el movimiento.")))
      }}
    >
      <Trash2 className="size-4" aria-hidden />
    </button>
  )
}
