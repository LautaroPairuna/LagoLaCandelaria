"use client"

import { useEffect, useState } from "react"

import { useContenido } from "@/components/contenido-del-sitio"
import { TicketAcciones } from "@/components/reserva/ticket-acciones"
import { TicketVista } from "@/components/reserva/ticket-vista"
import { telefonosDe } from "@/lib/contenido/derivados"
import type { TicketDatos } from "@/lib/reservas"

export function TicketPublico({ ticket, enlace }: { ticket: TicketDatos; enlace: string }) {
  const [qr, setQr] = useState("")
  const { contacto } = useContenido()

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
      <TicketVista ticket={ticket} qrDataUrl={qr || undefined} enlace={enlace} telefonos={telefonosDe(contacto)} />
      <TicketAcciones ticket={ticket} qrDataUrl={qr || undefined} enlace={enlace} />
    </div>
  )
}
