import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { TicketPublico } from "@/components/reserva/ticket-publico"
import { mensajePorId } from "@/lib/almacen-reservas"
import { leerSolicitud } from "@/lib/solicitud"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Ticket de reserva",
  description: "Solicitud de reserva de Lago La Candelaria, con el código QR del ingreso.",
}

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let mensaje = ""
  try {
    mensaje = (await mensajePorId(id)) ?? ""
  } catch {
    return (
      <main className="bg-foam px-5 py-32 text-ink md:px-8">
        <div className="mx-auto max-w-xl">
          <p className="kicker">Ticket</p>
          <h1 className="font-display mt-3 text-4xl tracking-tight">No pudimos abrir esta solicitud.</h1>
          <p className="mt-3 leading-relaxed text-ink/75">
            Probá de nuevo en un rato o llamá al predio con el código del ticket.
          </p>
        </div>
      </main>
    )
  }

  if (!mensaje) notFound()

  const solicitud = leerSolicitud(mensaje)
  if (!solicitud) notFound()

  return (
    <main className="bg-foam px-5 pt-28 pb-16 text-ink md:px-8 md:pt-32">
      <div className="mx-auto max-w-3xl">
        <TicketPublico solicitud={solicitud} />
      </div>
    </main>
  )
}
