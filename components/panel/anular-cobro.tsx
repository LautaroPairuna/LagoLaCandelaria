"use client"

import { useTransition } from "react"

import { anularCobro } from "@/app/panel/puerta/acciones"
import { conAviso } from "@/lib/avisos"
import { confirmar } from "@/components/panel/confirmador"

export function AnularCobro({ pagoId, descripcion }: { pagoId: number; descripcion: string }) {
  const [pendiente, iniciar] = useTransition()
  return (
    <button
      type="button"
      disabled={pendiente}
      className="text-sm font-semibold text-[#c62828] underline-offset-4 hover:underline disabled:opacity-50"
      onClick={async () => {
        if (!(await confirmar(`¿Dar de baja el cobro de ${descripcion}? Sale de la caja y la reserva vuelve a deberlo. Queda registrado en la actividad.`, { aceptar: "Dar de baja", peligro: true }))) return
        iniciar(async () => void (await conAviso(() => anularCobro({ pagoId }), "Listo, se dio de baja el cobro.")))
      }}
    >
      Dar de baja
    </button>
  )
}
