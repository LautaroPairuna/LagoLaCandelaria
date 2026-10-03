"use client"

import { useTransition } from "react"

import { cancelarReserva, confirmarReserva } from "@/app/panel/reservas/acciones"
import { Button } from "@/components/ui/button"
import { conAviso } from "@/lib/avisos"

export function AccionesReserva({ id, codigo, estado }: { id: number; codigo: string; estado: "PENDIENTE" | "CONFIRMADA" | "CANCELADA" }) {
  const [pendiente, iniciar] = useTransition()

  if (estado === "CANCELADA") return null

  return (
    <div className="flex flex-wrap gap-3">
      {estado === "PENDIENTE" ? (
        <Button
          type="button"
          disabled={pendiente}
          className="h-11 bg-panel-naranja px-5 text-white hover:bg-panel-tostado"
          onClick={() => iniciar(async () => void (await conAviso(() => confirmarReserva(id), `Listo, la reserva ${codigo} quedó confirmada.`)))}
        >
          {pendiente ? "Guardando…" : "Confirmar reserva"}
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        disabled={pendiente}
        className="h-11 px-5"
        onClick={() => {
          if (window.confirm("¿Cancelar la reserva? Los lugares quedan libres para otros.")) {
            iniciar(async () => void (await conAviso(() => cancelarReserva(id), `La reserva ${codigo} quedó cancelada y sus lugares, libres.`)))
          }
        }}
      >
        Cancelar reserva
      </Button>
    </div>
  )
}
