"use client"

import { Check, RotateCcw, X } from "lucide-react"
import { useTransition, type ReactNode } from "react"

import { responderConfirmacion } from "@/app/panel/reservas/acciones"
import { conAviso } from "@/lib/avisos"
import type { ParaConfirmar } from "@/lib/panel/confirmaciones"
import { cn } from "cn"

/// Los botones de cada reserva en "Confirmaciones": el WhatsApp (que arma la página) y
/// anotar qué respondió.
export function BotonesDeConfirmacion({ reserva, whatsapp }: { reserva: Pick<ParaConfirmar, "id" | "confirmacion" | "titular">; whatsapp: ReactNode }) {
  const [pendiente, iniciar] = useTransition()
  const responder = (respuesta: "CONFIRMO" | "CANCELO" | "SIN_RESPUESTA", exito: string) =>
    iniciar(async () => void (await conAviso(() => responderConfirmacion(reserva.id, respuesta), exito)))

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {whatsapp}
      {reserva.confirmacion === null ? (
        <>
          <button
            type="button"
            disabled={pendiente}
            onClick={() => responder("CONFIRMO", `Listo: ${reserva.titular} confirmó que viene.`)}
            className={cn("inline-flex h-9 items-center gap-1 rounded-full border-2 border-[#2e7d32] px-3 whitespace-nowrap text-sm font-bold text-[#2e7d32] hover:bg-[#2e7d32] hover:text-white disabled:opacity-60")}
          >
            <Check className="size-4" aria-hidden />
            Confirmó
          </button>
          <button
            type="button"
            disabled={pendiente}
            onClick={() => {
              if (window.confirm(`¿${reserva.titular} avisó que no viene? La reserva se cancela y se liberan los lugares.`)) responder("CANCELO", "Listo: la reserva quedó cancelada.")
            }}
            className="inline-flex h-9 items-center gap-1 rounded-full border-2 border-[#c62828] px-3 whitespace-nowrap text-sm font-bold text-[#c62828] hover:bg-[#c62828] hover:text-white disabled:opacity-60"
          >
            <X className="size-4" aria-hidden />
            No viene
          </button>
        </>
      ) : reserva.confirmacion === "CONFIRMO" ? (
        <button
          type="button"
          disabled={pendiente}
          onClick={() => responder("SIN_RESPUESTA", "Listo: volvió a sin respuesta.")}
          className="inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-sm text-panel-muted underline-offset-4 hover:underline"
        >
          <RotateCcw className="size-4" aria-hidden />
          Deshacer
        </button>
      ) : null}
    </div>
  )
}
