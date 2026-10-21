"use client"

import { CalendarClock, XCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { cancelarMiReserva } from "@/app/(sitio)/reserva/acciones"
import { avisarError, avisarExito, llamar } from "@/lib/avisos"

/// Lo que puede hacer el cliente con su reserva antes de la visita: cambiarla o cancelarla.
export function MiReservaAcciones({ token }: { token: string }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [cancelando, iniciar] = useTransition()

  function cancelar() {
    iniciar(async () => {
      const resultado = await llamar(() => cancelarMiReserva(token))
      if (!resultado.ok) {
        avisarError(resultado.error)
        return
      }
      avisarExito("Listo, tu reserva quedó cancelada.")
      setConfirmando(false)
      router.refresh()
    })
  }

  return (
    <div className="no-print rounded-[1.6rem] border border-ink/10 bg-white p-5">
      <p className="font-display text-2xl tracking-tight">¿Cambió algo?</p>
      <p className="mt-1 text-ink/70">Podés cambiar el día, el lugar, la cantidad de personas o la forma de pago, o cancelar la reserva.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-full border-2 border-ink/15 px-5 font-bold hover:border-[#c62828] hover:text-[#c62828]"
        >
          <XCircle className="size-5" aria-hidden />
          Cancelar
        </button>
        <Link
          href={`/reserva/t/${token}/modificar`}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-orange px-5 font-bold text-sobre-naranja hover:bg-orange-hover"
        >
          <CalendarClock className="size-5" aria-hidden />
          Modificar mi reserva
        </Link>
      </div>
      {confirmando ? (
        <div className="mt-4 rounded-2xl bg-[#fde8e4] p-4" role="alertdialog" aria-labelledby="cancelar-titulo">
          <p id="cancelar-titulo" className="font-semibold text-[#7a2e24]">
            ¿Seguro que querés cancelar la reserva? Se libera el lugar y no se puede deshacer.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={cancelando} onClick={cancelar} className="h-11 rounded-full bg-[#c62828] px-5 font-bold text-white disabled:opacity-60">
              {cancelando ? "Cancelando…" : "Sí, cancelar la reserva"}
            </button>
            <button type="button" onClick={() => setConfirmando(false)} className="h-11 rounded-full border border-ink/20 bg-white px-5 font-semibold">
              No, mantenerla
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
