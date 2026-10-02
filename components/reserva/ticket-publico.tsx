"use client"

import { useEffect, useState } from "react"

import { TicketAcciones } from "@/components/reserva/ticket-acciones"
import { TicketVista } from "@/components/reserva/ticket-vista"
import type { SolicitudGuardada } from "@/lib/solicitud"

export function TicketPublico({ solicitud, enlace }: { solicitud: SolicitudGuardada; enlace: string }) {
  const [qr, setQr] = useState("")

  useEffect(() => {
    let activo = true
    import("qrcode")
      .then((modulo) => modulo.default.toDataURL(enlace, { margin: 1, width: 280 }))
      .then((imagen) => {
        if (activo) setQr(imagen)
      })
      .catch(() => {
        if (activo) setQr("")
      })
    return () => {
      activo = false
    }
  }, [enlace])

  return (
    <div className="space-y-6">
      <TicketVista solicitud={solicitud} qrDataUrl={qr || undefined} enlace={enlace} />
      <TicketAcciones solicitud={solicitud} qrDataUrl={qr || undefined} enlace={enlace} />
    </div>
  )
}
