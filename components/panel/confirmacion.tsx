"use client"

import { Check, MessageCircle, RotateCcw, X } from "lucide-react"
import { useTransition } from "react"

import { responderConfirmacion } from "@/app/panel/reservas/acciones"
import { conAviso } from "@/lib/avisos"
import type { ParaConfirmar } from "@/lib/panel/confirmaciones"
import { cn } from "cn"

/// Los botones de cada reserva en "Confirmaciones": escribir por WhatsApp con el mensaje
/// listo y anotar qué respondió.
export function BotonesDeConfirmacion({ reserva }: { reserva: Pick<ParaConfirmar, "id" | "whatsapp" | "confirmacion" | "titular"> }) {
  const [pendiente, iniciar] = useTransition()
  const responder = (respuesta: "CONFIRMO" | "CANCELO" | "SIN_RESPUESTA", exito: string) =>
    iniciar(async () => void (await conAviso(() => responderConfirmacion(reserva.id, respuesta), exito)))

  return (
    <div className="flex flex-wrap items-center gap-2">
      {reserva.whatsapp ? (
        <a href={reserva.whatsapp} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full bg-[#25d366] px-4 text-sm font-bold text-white">
          <MessageCircle className="size-4" aria-hidden />
          Escribir por WhatsApp
        </a>
      ) : (
        <span className="text-sm text-panel-muted">Sin celular cargado</span>
      )}
      {reserva.confirmacion === null ? (
        <>
          <button
            type="button"
            disabled={pendiente}
            onClick={() => responder("CONFIRMO", `Listo: ${reserva.titular} confirmó que viene.`)}
            className={cn("inline-flex h-10 items-center gap-1.5 rounded-full border-2 border-[#2e7d32] px-4 text-sm font-bold text-[#2e7d32] hover:bg-[#2e7d32] hover:text-white disabled:opacity-60")}
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
            className="inline-flex h-10 items-center gap-1.5 rounded-full border-2 border-[#c62828] px-4 text-sm font-bold text-[#c62828] hover:bg-[#c62828] hover:text-white disabled:opacity-60"
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
          className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm text-panel-muted underline-offset-4 hover:underline"
        >
          <RotateCcw className="size-4" aria-hidden />
          Deshacer
        </button>
      ) : null}
    </div>
  )
}
