"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { htmlDelTicket } from "@/lib/ticket-html"
import type { TicketDatos } from "@/lib/reservas"

export function TicketAcciones({
  ticket,
  qrDataUrl,
  enlace,
}: {
  ticket: TicketDatos
  qrDataUrl?: string
  enlace: string
}) {
  const [aviso, setAviso] = useState("")

  async function descargar() {
    setAviso("")
    try {
      let qr = qrDataUrl
      if (!qr) {
        const QRCode = (await import("qrcode")).default
        qr = await QRCode.toDataURL(enlace, { margin: 1, width: 280 })
      }
      const archivo = new Blob([htmlDelTicket(ticket, qr, enlace)], { type: "text/html;charset=utf-8" })
      const url = URL.createObjectURL(archivo)
      const ancla = document.createElement("a")
      ancla.href = url
      ancla.download = `${ticket.codigo}.html`
      ancla.click()
      URL.revokeObjectURL(url)
    } catch {
      setAviso("No pudimos armar el archivo. Probá con Imprimir y guardalo como PDF.")
    }
  }

  return (
    <div className="no-print">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" className="h-12 px-6" onClick={descargar}>
          Descargar ticket
        </Button>
        <Button type="button" variant="outline" className="h-12 px-6" onClick={() => window.print()}>
          Imprimir o guardar PDF
        </Button>
      </div>
      {aviso ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {aviso}
        </p>
      ) : (
        <p className="mt-3 text-sm text-ink/60">
          El archivo queda en tu teléfono o computadora. El QR abre esta misma reserva.
        </p>
      )}
    </div>
  )
}
