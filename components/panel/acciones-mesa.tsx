"use client"

import { useTransition } from "react"

import { registrarAsistencia } from "@/app/panel/puerta/acciones"
import { AsistenciaDelGrupo, type Integrante } from "@/components/panel/asistencia-grupo"
import { Button } from "@/components/ui/button"
import { conAviso } from "@/lib/avisos"
import type { Asistencia, Movimiento } from "@/lib/panel/asistencia"

/// Llegada y salida de una reserva de mesa. Si la reserva tiene a cada persona cargada
/// se marca persona por persona (o por familia, o todos juntos); si no, la mesa entera.
export function AccionesMesa({
  id,
  titular,
  asistencia,
  integrantes,
}: {
  id: number
  titular: string
  asistencia: { porPersona: boolean; estado: Asistencia; adentro: number; salieron: number; total: number }
  integrantes: Integrante[]
}) {
  const [pendiente, iniciar] = useTransition()

  function mover(movimiento: Movimiento, exito: string) {
    iniciar(async () => void (await conAviso(() => registrarAsistencia({ reservaId: id, movimiento }), exito)))
  }

  if (asistencia.porPersona) return <AsistenciaDelGrupo reservaId={id} integrantes={integrantes} puedeMarcar plegado />

  return (
    <div className="flex flex-wrap items-center gap-3">
      {asistencia.estado === "por-llegar" || asistencia.estado === "no-vino" ? (
        <Button type="button" disabled={pendiente} className="h-11 bg-panel-ink px-5 text-white hover:bg-panel-tostado" onClick={() => mover("ingreso", `Listo, ${titular} ya está en la mesa.`)}>
          Llegaron a la mesa
        </Button>
      ) : null}
      {asistencia.estado === "adentro" ? (
        <Button type="button" variant="outline" disabled={pendiente} className="h-11 px-5" onClick={() => mover("salida", `Listo, ${titular} dejó la mesa.`)}>
          Se fueron
        </Button>
      ) : null}
      {asistencia.estado === "adentro" || asistencia.estado === "finalizada" ? (
        <button type="button" disabled={pendiente} className="text-sm text-panel-muted underline-offset-4 hover:underline" onClick={() => mover("deshacer", "Listo, se deshizo el último paso.")}>
          Deshacer
        </button>
      ) : null}
    </div>
  )
}
