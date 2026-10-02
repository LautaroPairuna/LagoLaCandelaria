"use client"

import { useEffect, useState } from "react"

import { TicketAcciones } from "@/components/reserva/ticket-acciones"
import { TicketVista } from "@/components/reserva/ticket-vista"
import type { SolicitudGuardada } from "@/lib/solicitud"

export function TicketPublico({ solicitud }: { solicitud: SolicitudGuardada }) {
  const [qr, setQr] = useState("")
  const [enlace, setEnlace] = useState("")

  useEffect(() => {
    const url = window.location.href
    setEnlace(url)
    let activo = true
    import("qrcode")
      .then((modulo) => modulo.default.toDataURL(url, { margin: 1, width: 280 }))
      .then((imagen) => {
        if (activo) setQr(imagen)
      })
      .catch(() => {
        if (activo) setQr("")
      })
    return () => {
      activo = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <TicketVista solicitud={solicitud} qrDataUrl={qr || undefined} enlace={enlace || undefined} />
      <TicketAcciones solicitud={solicitud} qrDataUrl={qr || undefined} enlace={enlace} />
    </div>
  )
}
