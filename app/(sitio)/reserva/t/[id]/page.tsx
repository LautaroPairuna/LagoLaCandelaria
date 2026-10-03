import { MessageCircle } from "lucide-react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { TicketPublico } from "@/components/reserva/ticket-publico"
import { ticketDeReserva } from "@/lib/reservas"
import { enlaceWhatsappDelPredio } from "@/lib/site"
import { urlSitio } from "@/lib/url-sitio"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Ticket de reserva",
  description: "Reserva de Lago La Candelaria, con el código QR del ingreso.",
  robots: { index: false, follow: false },
}

export default async function TicketPage({ params, searchParams }: PageProps<"/reserva/t/[id]">) {
  const { id } = await params
  const { nuevo } = await searchParams
  if (!/^[a-z0-9]{20,40}$/i.test(id)) notFound()

  let ticket: Awaited<ReturnType<typeof ticketDeReserva>> = null
  try {
    ticket = await ticketDeReserva(id)
  } catch {
    return (
      <main className="bg-foam px-5 py-32 text-ink md:px-8">
        <div className="mx-auto max-w-xl">
          <p className="kicker">Ticket</p>
          <h1 className="font-display mt-3 text-4xl tracking-tight">No pudimos abrir esta reserva.</h1>
          <p className="mt-3 leading-relaxed text-ink/75">Probá de nuevo en un rato o llamá al predio con el código del ticket.</p>
        </div>
      </main>
    )
  }

  if (!ticket) notFound()

  const whatsapp = enlaceWhatsappDelPredio(`Hola, tengo la reserva ${ticket.codigo}. Quiero hacer una consulta / modificar la cantidad de personas.`)

  return (
    <main className="bg-foam px-5 pt-28 pb-16 text-ink md:px-8 md:pt-32">
      <div className="mx-auto max-w-3xl space-y-6">
        {ticket.estado === "CANCELADA" ? (
          <p className="rounded-2xl bg-destructive/10 px-5 py-4 font-semibold text-destructive" role="status">
            Esta reserva está cancelada. Si es un error, escribinos o llamá al predio.
          </p>
        ) : nuevo ? (
          <div className="no-print">
            <p className="kicker">Reserva registrada</p>
            <h1 className="font-display mt-2 text-4xl tracking-tight md:text-5xl">Este es tu ticket.</h1>
            <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink/75">
              Guardalo o descargalo. El equipo del predio revisa la reserva y te confirma por WhatsApp.
            </p>
          </div>
        ) : null}
        <a
          href={whatsapp}
          target="_blank"
          rel="noreferrer"
          className="no-print inline-flex items-center gap-2 rounded-full bg-[#25d366] px-5 py-3 font-bold text-white"
        >
          <MessageCircle className="size-5" aria-hidden />
          Consultas y modificar cantidad de personas
        </a>
        <TicketPublico ticket={ticket} enlace={`${urlSitio}/reserva/t/${id}`} />
      </div>
    </main>
  )
}
