"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { cancelarReserva, confirmarReserva } from "@/app/panel/reservas/acciones"
import { Button } from "@/components/ui/button"

export function AccionesReserva({ id, estado }: { id: number; estado: "PENDIENTE" | "CONFIRMADA" | "CANCELADA" }) {
  const [pendiente, iniciar] = useTransition()

  function ejecutar(accion: () => Promise<void>, exito: string) {
    iniciar(async () => {
      try {
        await accion()
        toast.success(exito)
      } catch {
        toast.error("No se pudo guardar el cambio. Probá de nuevo.")
      }
    })
  }

  if (estado === "CANCELADA") return null

  return (
    <div className="flex flex-wrap gap-3">
      {estado === "PENDIENTE" ? (
        <Button
          type="button"
          disabled={pendiente}
          className="h-11 bg-panel-naranja px-5 text-white hover:bg-panel-tostado"
          onClick={() => ejecutar(() => confirmarReserva(id), "Reserva confirmada.")}
        >
          Confirmar reserva
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        disabled={pendiente}
        className="h-11 px-5"
        onClick={() => {
          if (window.confirm("¿Cancelar la reserva? Los lugares quedan libres para otros.")) {
            ejecutar(() => cancelarReserva(id), "Reserva cancelada.")
          }
        }}
      >
        Cancelar reserva
      </Button>
    </div>
  )
}
