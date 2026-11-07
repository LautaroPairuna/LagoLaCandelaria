"use client"

import { Trash2 } from "lucide-react"
import { useTransition } from "react"

import { borrarMovimiento } from "@/app/panel/caja/acciones"
import { conAviso } from "@/lib/avisos"
import { confirmar } from "@/components/panel/confirmador"

export function BorrarMovimiento({ id, descripcion }: { id: number; descripcion: string }) {
  const [pendiente, iniciar] = useTransition()
  return (
    <button
      type="button"
      disabled={pendiente}
      aria-label={`Borrar ${descripcion}`}
      title="Borrar este movimiento"
      className="grid size-9 place-items-center rounded-full text-panel-muted hover:bg-[#fde9e7] hover:text-[#c62828] disabled:opacity-50"
      onClick={async () => {
        if (!(await confirmar(`¿Borrar ${descripcion}? Queda registrado en la actividad.`, { aceptar: "Borrar", peligro: true }))) return
        iniciar(async () => void (await conAviso(() => borrarMovimiento({ id }), "Listo, se borró el movimiento.")))
      }}
    >
      <Trash2 className="size-4" aria-hidden />
    </button>
  )
}
